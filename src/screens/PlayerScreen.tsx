import {
  ChangeChannelStatus,
  ChannelServerComponent2,
  OperationError,
} from '@amazon-devices/kepler-channel';
import {
  ContentPersonalizationServer,
  PlaybackState,
} from '@amazon-devices/kepler-content-personalization';
import {
  BackHandler,
  HWEvent,
  IComponentInstance,
  IKeplerAppStateManager,
  KeplerAppStateChangeData,
  KeplerAppStateEvent,
  useKeplerAppStateManager,
  useTVEventHandler,
} from '@amazon-devices/react-native-kepler';
import {
  KeplerVideoSurfaceView,
  KeplerCaptionsView,
  VideoPlayer,
} from '@amazon-devices/react-native-w3cmedia';
import isEqual from 'lodash/isEqual';
import React, { useCallback, useEffect, useRef } from 'react';
import ErrorView from '../components/ErrorView';
import { focusManager } from '../utils/FocusManager';

import { SafeAreaView } from '@amazon-devices/react-native-safe-area-context';
import { RouteProp } from '@amazon-devices/react-navigation__core';
import { StackNavigationProp } from '@amazon-devices/react-navigation__stack';
import {
  AppStateStatus,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import BufferingWindow from '../components/BufferingWindow';
import {
  AppStackParamList,
  AppStackScreenProps,
  Screens,
} from '../components/navigation/types';
import { isContentPersonalizationEnabled } from '../config/AppConfig';
import { CAPTION_DISABLE_ID, EVENT_KEY_DOWN } from '../constants';
import { getMockPlaybackEventForVideo } from '../personalization/mock/ContentPersonalizationMocks';
import { getBifFrameImageSource } from '../services/bif/bifService';
import { FrameImageSource } from '../services/bif/FrameImageSource';
import { COLORS } from '../styles/Colors';
import { VideoHandler } from '../utils/VideoHandler';
import VideoPlayerUI from '../w3cmedia/mediacontrols/VideoPlayerUI';
// HLS.js Player - lżejszy i lepiej zoptymalizowany dla HLS
import { HlsJsPlayer } from '../hlsjsplayer/HlsJsPlayer';

const BACKGROUND_STATE: AppStateStatus = 'background';
const TIME_TO_GO_BACK_IF_VIDEO_ENDS = 2300;
const BACK_NAVIGATION_DELAY = 700;

interface PlayerProps {
  navigation: StackNavigationProp<AppStackParamList, Screens.PLAYER_SCREEN>;
  route: RouteProp<AppStackParamList, Screens.PLAYER_SCREEN>;
}

const PlayerScreen = ({
  navigation,
  route,
}: AppStackScreenProps<Screens.PLAYER_SCREEN>) => {
  const { data, onChannelTuneSuccess, onChannelTuneFailed } = route.params;
  
  // === HOOKS MUSZĄ BYĆ ZAWSZE W TEJ SAMEJ KOLEJNOŚCI ===
  const { width: deviceWidth, height: deviceHeight } = useWindowDimensions();
  const keplerAppStateManager: IKeplerAppStateManager = useKeplerAppStateManager();
  
  // === WSZYSTKIE useState ===
  const [showBuffering, setShowBuffering] = React.useState<boolean>(true);
  const [isVideoInitialized, setIsVideoInitialized] = React.useState<boolean>(false);
  const [isVideoEnded, setVideoEnded] = React.useState<boolean>(false);
  const [isVideoError, setVideoError] = React.useState<boolean>(false);
  const [videoPlayElapsedTimeM, setVideoPlayElapsedTimeM] = React.useState<number>(0);
  const [captionID, setCaptionID] = React.useState<string>(CAPTION_DISABLE_ID);

  // === WSZYSTKIE useRef ===
  const surfaceHandle = useRef<string | null>(null);
  const captionViewHandle = useRef<string | null>(null);
  const captionStatus = useRef<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<VideoPlayer | null>(null);
  const player = useRef<HlsJsPlayer | null>(null);
  const bifFrameImagesRef = useRef<FrameImageSource | null>(null);
  const isSourceLoaded = useRef<boolean>(false);
  const isSurfaceReady = useRef<boolean>(false);
  const videoHandlerRef = useRef<VideoHandler | null>(null);

  // === DERIVED VALUES (nie hooki) ===
  const componentInstance: IComponentInstance = keplerAppStateManager.getComponentInstance();
  const showVideoPlayerUI = !isVideoError;

  // === HELPER FUNCTIONS (nie hooki) ===
  const setCaptionStatusFn = (status: boolean) => {
    captionStatus.current = status;
  };

  const setSelectedCaptionInVideoPlayer = (id: string) => {
    setCaptionID(id);
  };

  const addKeplerAppStateListenerCallback = (
    eventType: KeplerAppStateEvent,
    handler: (state: KeplerAppStateChangeData) => void,
  ) => keplerAppStateManager.addAppStateListener(eventType, handler);

  // === useTVEventHandler ===
  useTVEventHandler((evt: HWEvent) => {
    if (!Platform.isTV) return;
    if (evt && evt.eventKeyAction === EVENT_KEY_DOWN) {
      if (isVideoEnded) {
        if (timer.current) clearTimeout(timer.current);
        setVideoEnded(false);
      }
    }
  });

  // === WSZYSTKIE useCallback W STAŁEJ KOLEJNOŚCI ===
  
  const reportVideoExit = useCallback(() => {
    if (!isContentPersonalizationEnabled()) return;
    try {
      if (videoRef.current) {
        const playbackEvent = getMockPlaybackEventForVideo(
          videoRef,
          videoRef.current.currentSrc,
          PlaybackState.EXIT,
        );
        ContentPersonalizationServer.reportNewPlaybackEvent(playbackEvent);
      }
    } catch (e) {
      console.error('[PlayerScreen] reportVideoExit error:', e);
    }
  }, []);

  const reportVideoPlaying = useCallback(() => {
    if (!isContentPersonalizationEnabled()) return;
    try {
      if (videoRef.current) {
        const playbackEvent = getMockPlaybackEventForVideo(
          videoRef,
          videoRef.current.currentSrc,
          PlaybackState.PLAYING,
        );
        ContentPersonalizationServer.reportNewPlaybackEvent(playbackEvent);
      }
    } catch (e) {
      console.error('[PlayerScreen] reportVideoPlaying error:', e);
    }
  }, []);

  const navigateBack = useCallback(() => {
    if (captionStatus.current) {
      captionStatus.current = false;
      return true;
    }

    reportVideoExit();

    surfaceHandle.current = null;
    captionViewHandle.current = null;
    videoRef.current?.clearSurfaceHandle('');
    videoRef.current?.clearCaptionViewHandle('');
    videoHandlerRef.current?.destroyVideoElements();
    videoRef.current = null;
    if (timer.current) clearTimeout(timer.current);

    setTimeout(() => navigation.goBack(), BACK_NAVIGATION_DELAY);
    return true;
  }, [navigation, reportVideoExit]);

  const handleAppStateChange = useCallback(
    (nextAppState: KeplerAppStateChangeData): void => {
      console.log('[PlayerScreen] App state changed:', nextAppState);
      if (nextAppState === BACKGROUND_STATE) {
        setShowBuffering(false);
        navigateBack();
      }
    },
    [navigateBack],
  );

  const startPlayback = useCallback(async () => {
    console.log('[PlayerScreen] startPlayback called');
    
    if (!videoRef.current) {
      console.error('[PlayerScreen] No video ref!');
      return;
    }

    try {
      await videoRef.current.play();
      setShowBuffering(false);
      console.log('[PlayerScreen] Playback started successfully');
      
      if (onChannelTuneSuccess) {
        const channelResponse = ChannelServerComponent2.makeChannelResponseBuilder()
          .status(ChangeChannelStatus.SUCCESS)
          .data(data.title)
          .build();
        onChannelTuneSuccess(channelResponse);
      }
      
      reportVideoPlaying();
    } catch (error) {
      console.error('[PlayerScreen] startPlayback error:', error);
      if (onChannelTuneFailed) {
        onChannelTuneFailed(
          new OperationError(`Video could not be played: ${error}`),
        );
      }
    }
  }, [data.title, onChannelTuneSuccess, onChannelTuneFailed, reportVideoPlaying]);

  const loadSourceAndPlay = useCallback(async () => {
    console.log('[PlayerScreen] loadSourceAndPlay called');

    if (!isSurfaceReady.current) {
      console.log('[PlayerScreen] Surface not ready yet');
      return;
    }

    if (isSourceLoaded.current) {
      console.log('[PlayerScreen] Source already loaded');
      return;
    }

    if (!videoRef.current || !surfaceHandle.current) {
      console.error('[PlayerScreen] Missing videoRef or surfaceHandle');
      return;
    }

    // Ustaw surface handle
    videoRef.current.setSurfaceHandle(surfaceHandle.current);
    console.log('[PlayerScreen] Surface handle set');

    // Pobierz BIF jeśli dostępny
    if (data?.bifUrl) {
      bifFrameImagesRef.current = await getBifFrameImageSource(data.bifUrl);
    }

    // Oznacz że źródło będzie ładowane
    isSourceLoaded.current = true;

    // 🔥 KLUCZOWE: Załaduj źródło przez VideoHandler
    console.log('[PlayerScreen] Loading source via VideoHandler...');
    if (videoHandlerRef.current) {
      videoHandlerRef.current.loadSourceAfterSurface();
    }

    // Określ typ formatu
    const format = (data.format || 'MP4').toUpperCase();
    const isAdaptive = format === 'HLS' || format === 'DASH' || format === 'M3U8';
    
    if (isAdaptive) {
      console.log('[PlayerScreen] Waiting for HLS.js to load stream...');
      setTimeout(() => startPlayback(), 800);
    } else {
      console.log('[PlayerScreen] Static media - starting playback...');
      setTimeout(() => {
        if (videoRef.current) {
          const video = videoRef.current as any;
          if (video.paused !== false) {
            startPlayback();
          } else {
            setShowBuffering(false);
          }
        }
      }, 300);
    }
  }, [data, startPlayback]);

  const onSurfaceViewCreated = useCallback(
    (_surfaceHandle: string): void => {
      console.log('[PlayerScreen] === SURFACE CREATED ===');
      surfaceHandle.current = _surfaceHandle;
      isSurfaceReady.current = true;
      loadSourceAndPlay();
    },
    [loadSourceAndPlay],
  );

  const onSurfaceViewDestroyed = useCallback((_surfaceHandle: string): void => {
    console.log('[PlayerScreen] Surface destroyed');
    videoRef.current?.clearSurfaceHandle(_surfaceHandle);
    isSurfaceReady.current = false;
  }, []);

  const onCaptionViewCreated = useCallback((captionsHandle: string): void => {
    console.log('[PlayerScreen] Caption view created');
    captionViewHandle.current = captionsHandle;
    if (videoRef.current && captionViewHandle.current) {
      videoRef.current.setCaptionViewHandle(captionViewHandle.current);
    }
  }, []);

  const onCaptionViewDestroyed = useCallback((captionsHandle: string): void => {
    console.log('[PlayerScreen] Caption view destroyed');
    if (videoRef.current) {
      videoRef.current.clearCaptionViewHandle(captionsHandle);
    }
    captionViewHandle.current = null;
  }, []);

  // === WSZYSTKIE useEffect W STAŁEJ KOLEJNOŚCI ===

  // 1. Inicjalizacja VideoHandler
  useEffect(() => {
    if (!videoHandlerRef.current) {
      console.log('[PlayerScreen] Creating VideoHandler for:', data.title, 'Format:', data.format);
      videoHandlerRef.current = new VideoHandler(
        videoRef,
        player,
        data,
        setIsVideoInitialized,
        setVideoEnded,
        setVideoError,
        setVideoPlayElapsedTimeM,
        setShowBuffering,
      );
    }
  }, [data]);

  // 2. Główna inicjalizacja
  useEffect(() => {
    console.log('[PlayerScreen] === INITIALIZING ===');
    console.log('[PlayerScreen] Title:', data.title);
    console.log('[PlayerScreen] URI:', data.uri);
    console.log('[PlayerScreen] Format:', data.format);

    isSourceLoaded.current = false;
    isSurfaceReady.current = false;

    // Inicjalizuj VideoPlayer
    if (videoHandlerRef.current) {
      videoHandlerRef.current.preBufferVideo(componentInstance);
    }
    
    // Setup event listeners
    if (Platform.isTV) {
      BackHandler.addEventListener('hardwareBackPress', navigateBack);
    }
    
    const changeSubscription = addKeplerAppStateListenerCallback(
      'change',
      handleAppStateChange,
    );

    return () => {
      console.log('[PlayerScreen] === CLEANUP ===');
      changeSubscription.remove();
      if (timer.current) clearTimeout(timer.current);
      if (Platform.isTV) {
        BackHandler.removeEventListener('hardwareBackPress', navigateBack);
      }
      if (route.params.focusId) {
        focusManager.restoreFocus(`player_return_${route.params.focusId}`);
      }
    };
  }, [componentInstance, data, navigateBack, handleAppStateChange, route.params.focusId]);

  // 3. Auto-back po zakończeniu wideo
  useEffect(() => {
    if (!isVideoEnded) return;
    
    timer.current = setTimeout(() => {
      navigateBack();
    }, TIME_TO_GO_BACK_IF_VIDEO_ENDS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isVideoEnded, navigateBack]);

  // 4. Cleanup przy unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        surfaceHandle.current = null;
        captionViewHandle.current = null;
        videoRef.current.clearSurfaceHandle('');
        videoRef.current.clearCaptionViewHandle('');
        videoHandlerRef.current?.destroyVideoElements();
        videoRef.current = null;
        if (timer.current) clearTimeout(timer.current);
      }
      if (bifFrameImagesRef.current) {
        bifFrameImagesRef.current.clearCache();
        bifFrameImagesRef.current = null;
      }
    };
  }, []);

  // 5. Obsługa błędów
  useEffect(() => {
    if (isVideoError) {
      setShowBuffering(false);
    }
  }, [isVideoError]);

  // 6. Raportowanie postępu
  useEffect(() => {
    if (videoPlayElapsedTimeM === 0) return;
    reportVideoPlaying();
  }, [reportVideoPlaying, videoPlayElapsedTimeM]);

  // === RENDER ===
  return (
    <SafeAreaView style={styles.playerContainer} testID="safe-area-view">
      <View
        style={[
          styles.surfaceContainer,
          { width: deviceWidth, height: deviceHeight },
        ]}
        testID="player-container">
        
        {isVideoInitialized && (
          <>
            <KeplerVideoSurfaceView
              style={styles.videoSurface}
              onSurfaceViewCreated={onSurfaceViewCreated}
              onSurfaceViewDestroyed={onSurfaceViewDestroyed}
              testID="kepler-video-surface-view"
            />
            <KeplerCaptionsView
              onCaptionViewCreated={onCaptionViewCreated}
              onCaptionViewDestroyed={onCaptionViewDestroyed}
              style={styles.captions}
              show={captionID !== CAPTION_DISABLE_ID}
              testID="kepler-captions-view"
            />
          </>
        )}

        {showBuffering && (
          <BufferingWindow backgroundColor={COLORS.SEMI_TRANSPARENT} />
        )}
        
        {showVideoPlayerUI && (
          <VideoPlayerUI
            videoRef={videoRef}
            navigateBack={navigateBack}
            title={data.title}
            setCaptionStatus={setCaptionStatusFn}
            setSelectedCaptionInVideoPlayer={setSelectedCaptionInVideoPlayer}
            bifFrameImagesRef={bifFrameImagesRef}
            videoData={data}
          />
        )}
        
        {isVideoError && <ErrorView navigateBack={navigateBack} />}
      </View>
    </SafeAreaView>
  );
};

const arePlayerPropsEqual = (
  prevProps: PlayerProps,
  nextProps: PlayerProps,
) => isEqual(prevProps, nextProps);

export default React.memo(PlayerScreen, arePlayerPropsEqual);

export const styles = StyleSheet.create({
  captions: {
    width: '100%',
    height: '100%',
    left: 0,
    bottom: 120,
    position: 'absolute',
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  },
  playerContainer: { 
    backgroundColor: COLORS.GRAY, 
    height: '100%' 
  },
  surfaceContainer: { 
    backgroundColor: COLORS.BLACK, 
    alignItems: 'stretch' 
  },
  videoSurface: { 
    zIndex: 0 
  },
});
