/*
 * Copyright (c) 2024 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
 */

import * as React from 'react';
import {useRef, useState, useEffect} from 'react';
import {
  Platform,
  useWindowDimensions,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';

import {
  VideoPlayer,
  KeplerVideoSurfaceView,
  KeplerCaptionsView,
} from '@amazon-devices/react-native-w3cmedia';
import { HlsJsPlayer } from './hlsjsplayer/HlsJsPlayer';

// set to false if app wants to call play API on video manually
const AUTOPLAY = true;

const DEFAULT_ABR_WIDTH: number = Platform.isTV ? 3840 : 1919;
const DEFAULT_ABR_HEIGHT: number = Platform.isTV ? 2160 : 1079;

const content = [
  {
    secure: 'false', // true : Use Secure Video Buffers. false: Use Unsecure Video Buffers.
    uri: 'https://storage.googleapis.com/shaka-demo-assets/bbb-dark-truths-hls/hls.m3u8',
    drm_scheme: '', // com.microsoft.playready, com.widevine.alpha
    drm_license_uri: '', // DRM License acquisition server URL : needed only if the content is DRM protected
  },
];

export const App = () => {
  const player = useRef<any>(null);
  const videoPlayer = useRef<VideoPlayer | null>(null);
  const timeoutHandler = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buttonPress, setButtonPress] = useState(false);
  const [nextContent, setNextContent] = useState({index: 0}); // { index: number }
  // Track the nextContent state for re-rendering
  const nextContentRef = useRef<number>(0);
  // Render in Full screen resolution
  const {width: deviceWidth, height: deviceHeight} = useWindowDimensions();

  useEffect(() => {
    if (nextContent.index !== nextContentRef.current) {
      nextContentRef.current = nextContent.index;
      // Force Re-rendering of <Video> component.
      initializeVideoPlayer();
      setNextContent((prev) => {
        return {...prev};
      });
    }
  }, [nextContent]);

  useEffect(() => {
    console.log('app:  start AppPreBuffering v13.0');
    initializeVideoPlayer();
  }, []);

  const onEnded = async () => {
    console.log('app: onEnded received');
    player.current.unload();
    player.current = null;
    await videoPlayer.current?.deinitialize();
    removeEventListeners();
    onVideoUnMounted();
    setNextContent({index: (nextContent.index + 1) % content.length});
  };

  const onError = () => {
    console.log(`app: AppPreBuffering: error event listener called`);
  };

  const setUpEventListeners = (): void => {
    console.log('app: setup event listeners');
    videoPlayer.current?.addEventListener('ended', onEnded);
    videoPlayer.current?.addEventListener('error', onError);
  };

  const removeEventListeners = (): void => {
    console.log('app: remove event listeners');
    videoPlayer.current?.removeEventListener('ended', onEnded);
    videoPlayer.current?.removeEventListener('error', onError);
  };

  const initializeVideoPlayer = async () => {
    console.log('app: calling initializeVideoPlayer');
    videoPlayer.current = new VideoPlayer();
    // @ts-ignore
    global.gmedia = videoPlayer.current;
    await videoPlayer.current.initialize();
    setUpEventListeners();
    videoPlayer.current!.autoplay = false;
    initializeHls();
  };

  const onSurfaceViewCreated = (surfaceHandle: string): void => {
    console.log('app: surface created');
    videoPlayer.current?.setSurfaceHandle(surfaceHandle);
    videoPlayer.current?.play();
  };

  const onSurfaceViewDestroyed = (surfaceHandle: string): void => {
    videoPlayer.current?.clearSurfaceHandle(surfaceHandle);
  };

  const onCaptionViewCreated = (captionsHandle: string): void => {
    console.log('app: caption view created');
    videoPlayer.current?.setCaptionViewHandle(captionsHandle);
  };

  const initializeHls = () => {
    console.log('app: in initializePlayer() index = ', nextContent.index);
    if (videoPlayer.current !== null) {
      player.current = new HlsJsPlayer(videoPlayer.current);
    }
    if (player.current !== null) {
      player.current.load(content[nextContent.index], AUTOPLAY);
    }
  };

  const onVideoUnMounted = (): void => {
    console.log('app: in onVideoUnMounted');
    // @ts-ignore
    global.gmedia = null;
    videoPlayer.current = null;
  };

  if (!buttonPress) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setButtonPress(true);
          }}
          hasTVPreferredFocus={true}
          activeOpacity={1}>
          <Text style={styles.buttonLabel}> Press to Play Video </Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    return nextContent.index === nextContentRef.current ? (
      <View style={styles.videoContainer}>
        <KeplerVideoSurfaceView
          style={styles.surfaceView}
          onSurfaceViewCreated={onSurfaceViewCreated}
          onSurfaceViewDestroyed={onSurfaceViewDestroyed}
        />
        <KeplerCaptionsView
          onCaptionViewCreated={onCaptionViewCreated}
          style={styles.captionView}
        />
      </View>
    ) : (
      <View style={styles.videoContainer}></View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#283593',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#303030',
    borderColor: 'navy',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonLabel: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Amazon Ember',
  },
  videoContainer: {
    backgroundColor: 'white',
    alignItems: 'stretch',
  },
  surfaceView: {
    zIndex: 0,
  },
  captionView: {
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: 'transparent',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
  }
});
