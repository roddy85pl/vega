import { IComponentInstance } from '@amazon-devices/react-native-kepler';
import { VideoPlayer } from '@amazon-devices/react-native-w3cmedia';
import React from 'react';
import { TitleData } from '../types/TitleData';
// HLS.js Player - lżejszy i lepiej zoptymalizowany dla HLS
import { HlsJsPlayer } from '../hlsjsplayer/HlsJsPlayer';
import { AppOverrideMediaControlHandler } from './AppOverrideMediaControlHandler';
import { SKIP_INTERVAL_SECONDS } from './videoPlayerValues';

type MediaPlayerDeInitStatus = 'success' | 'timedout' | 'invalid';

export class VideoHandler {
  public videoRef: React.MutableRefObject<VideoPlayer | null>;
  public player: React.MutableRefObject<HlsJsPlayer | null>;
  public selectedFileType: string;
  public data: TitleData;
  public setIsVideoInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  public setIsVideoEnded: React.Dispatch<React.SetStateAction<boolean>>;
  public setIsVideoError: React.Dispatch<React.SetStateAction<boolean>>;
  public setVideoPlayElapsedTimeM: React.Dispatch<React.SetStateAction<number>>;
  public setShowBuffering: React.Dispatch<React.SetStateAction<boolean>>;

  private sourceLoaded: boolean = false;

  constructor(
    videoRef: React.MutableRefObject<VideoPlayer | null>,
    player: React.MutableRefObject<HlsJsPlayer | null>,
    data: TitleData,
    setIsVideoInitialized: React.Dispatch<React.SetStateAction<boolean>>,
    setIsVideoEnded: React.Dispatch<React.SetStateAction<boolean>>,
    setIsVideoError: React.Dispatch<React.SetStateAction<boolean>>,
    setVideoPlayElapsedTimeM: React.Dispatch<React.SetStateAction<number>>,
    setShowBuffering: React.Dispatch<React.SetStateAction<boolean>>,
  ) {
    this.videoRef = videoRef;
    this.player = player;
    this.data = data;
    this.selectedFileType = data.format || 'MP4';
    this.setIsVideoInitialized = setIsVideoInitialized;
    this.setIsVideoEnded = setIsVideoEnded;
    this.setIsVideoError = setIsVideoError;
    this.setVideoPlayElapsedTimeM = setVideoPlayElapsedTimeM;
    this.setShowBuffering = setShowBuffering;
    this.sourceLoaded = false;
    
    // Bind methods
    this.onLoadeMetaData = this.onLoadeMetaData.bind(this);
    this.onEnded = this.onEnded.bind(this);
    this.onError = this.onError.bind(this);
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onWaiting = this.onWaiting.bind(this);
    this.onSeeking = this.onSeeking.bind(this);
    this.onSeeked = this.onSeeked.bind(this);
    this.onPlaying = this.onPlaying.bind(this);
  }

  setMediaData(mediaData: TitleData): void {
    this.data = mediaData;
    this.selectedFileType = mediaData.format || 'MP4';
    this.sourceLoaded = false;
  }

  // Sprawdź czy to adaptive streaming (HLS/DASH)
  isAdaptiveStreaming(): boolean {
    const format = (this.selectedFileType || '').toUpperCase();
    return format === 'HLS' || format === 'DASH' || format === 'M3U8';
  }

  // Sprawdź czy to static media (MP4, MKV, AVI)
  isStaticMedia(): boolean {
    const format = (this.selectedFileType || '').toUpperCase();
    return ['MP4', 'MKV', 'AVI', 'MOV', 'WEBM', 'TS'].includes(format);
  }

  async preBufferVideo(componentInstance?: IComponentInstance): Promise<void> {
    await this.destroyVideoElements();
    console.info('[VideoHandler] preBufferVideo - Starting...');

    if (this.videoRef.current == null) {
      console.info('[VideoHandler] preBufferVideo - Creating new VideoPlayer');
      this.videoRef.current = new VideoPlayer();
    }
    (global as any).gmedia = this.videoRef.current;

    try {
      if (componentInstance) {
        console.info('[VideoHandler] preBufferVideo - Setting KMC');
        await this.videoRef.current.setMediaControlFocus(
          componentInstance,
          new AppOverrideMediaControlHandler(
            this.videoRef.current as VideoPlayer,
            false,
          ),
        );
      }
    } catch (error) {
      console.error('[VideoHandler] Error during KMC execution', error);
    }

    try {
      await this.videoRef.current.initialize();
      console.log('[VideoHandler] preBufferVideo - VideoPlayer Initialized');
      this.setupEventListeners();
      this.videoRef.current.autoplay = false;
      
      console.log('[VideoHandler] preBufferVideo - Waiting for surface');
      this.setIsVideoInitialized(true);
    } catch (error) {
      console.error('[VideoHandler] preBufferVideo - Failed to initialize Video');
      console.error(error);
      this.setIsVideoError(true);
    }
  }

  loadSourceAfterSurface(): void {
    if (this.sourceLoaded) {
      console.log('[VideoHandler] loadSourceAfterSurface - Already loaded');
      return;
    }

    if (!this.videoRef.current) {
      console.error('[VideoHandler] loadSourceAfterSurface - No video ref');
      return;
    }

    console.log('[VideoHandler] loadSourceAfterSurface - Loading...');
    this.sourceLoaded = true;
    this.loadVideoElements();
  }

  loadVideoElements(): void {
    if (this.videoRef !== null && this.videoRef.current !== null) {
      try {
        this.loadSubtitles();
      } catch (error) {
        console.error('[VideoHandler] Failed to load subtitles');
      }
      
      this.videoRef.current.autoplay = false;
      this.videoRef.current.defaultSeekIntervalInSec = SKIP_INTERVAL_SECONDS;

      const format = (this.selectedFileType || '').toUpperCase();
      console.log(`[VideoHandler] Format: ${format}, URI: ${this.data.uri}`);

      if (this.isAdaptiveStreaming()) {
        // HLS/DASH - użyj HLS.js (lżejszy i lepiej zoptymalizowany dla HLS)
        console.log('[VideoHandler] Using HLS.js for adaptive streaming');
        this.loadWithHlsPlayer();
      } else {
        // MP4/MKV/AVI - użyj natywnego playera
        console.log('[VideoHandler] Using native player for static media');
        this.loadStaticMedia();
      }
    }
  }

  // Ładowanie static media (MP4/MKV)
  loadStaticMedia(): void {
    if (!this.videoRef.current) return;

    const video = this.videoRef.current as any;
    console.log(`[VideoHandler] loadStaticMedia - Setting src: ${this.data.uri}`);

    // Ustaw src
    video.src = this.data.uri;

    // Nasłuchuj na canplay
    const onCanPlayHandler = () => {
      console.log('[VideoHandler] loadStaticMedia - canplay event');
      video.removeEventListener('canplay', onCanPlayHandler);
    };

    const onLoadedDataHandler = () => {
      console.log('[VideoHandler] loadStaticMedia - loadeddata event');
      video.removeEventListener('loadeddata', onLoadedDataHandler);
      this.setShowBuffering(false);
    };

    const onErrorHandler = (e: any) => {
      console.error('[VideoHandler] loadStaticMedia - Error loading media:', e);
      video.removeEventListener('error', onErrorHandler);
    };

    video.addEventListener('canplay', onCanPlayHandler);
    video.addEventListener('loadeddata', onLoadedDataHandler);
    video.addEventListener('error', onErrorHandler);

    // Dla MP4 wywołaj play() po ustawieniu src
    console.log('[VideoHandler] loadStaticMedia - Calling play()');
    setTimeout(() => {
      if (video.play) {
        video.play()
          .then(() => {
            console.log('[VideoHandler] loadStaticMedia - Play started');
            this.setShowBuffering(false);
          })
          .catch((err: any) => {
            console.log('[VideoHandler] loadStaticMedia - Play error:', err);
          });
      }
    }, 100);
  }

  loadWithHlsPlayer(): void {
    if (this.videoRef?.current) {
      try {
        // Utwórz instancję HLS.js Player
        this.player.current = new HlsJsPlayer(this.videoRef.current);
        console.log('[VideoHandler] HLS.js player initialized');

        if (this.player.current) {
          try {
            // Konfiguracja dla HLS.js
            const hlsConfig = {
              uri: this.data.uri,
              secure: this.data.secure ? 'true' : 'false',
              drm_scheme: this.data.drm_scheme || '',
              drm_license_uri: this.data.drm_license_uri || '',
            };

            // autoplay = false, PlayerScreen wywoła play()
            this.player.current.load(hlsConfig, false);
            console.log(`[VideoHandler] HLS.js loading: ${this.data.uri}`);
          } catch (loadError) {
            console.error('[VideoHandler] HLS.js load error:', loadError);
            this.setIsVideoError(true);
          }
        }
      } catch (error) {
        console.error('[VideoHandler] HLS.js init error:', error);
        this.setIsVideoError(true);
      }
    }
  }

  loadSubtitles(): void {
    const source = this.data;
    if (source?.textTrack && source.textTrack.length > 0) {
      for (let i: number = 0; i < source.textTrack.length; i++) {
        this.videoRef.current?.addTextTrack(
          'subtitles',
          source.textTrack[i].label,
          source.textTrack[i].language,
          source.textTrack[i].uri,
          source.textTrack[i].mimeType,
        );
      }
    }
  }

  onLoadeMetaData(): void {
    if (this.videoRef.current) {
      console.log('[VideoHandler] onLoadeMetaData');
    }
  }

  onEnded(): void {
    if (this.videoRef.current?.ended) {
      console.log('[VideoHandler] onEnded');
      this.setIsVideoEnded(true);
    }
  }

  onError(event: any): void {
    if (!this.sourceLoaded) {
      console.log('[VideoHandler] Ignoring early error');
      return;
    }

    // Dla static media ignoruj "No Error"
    const error = event?.target?.mediaControlStateUtil?.mError;
    const errorMessage = error?.message_ || '';
    
    if (errorMessage === '' || errorMessage === 'No Error') {
      console.log('[VideoHandler] Ignoring empty error for static media');
      return;
    }

    console.error(`[VideoHandler] Error: ${errorMessage}`);
    this.setIsVideoError(true);
  }

  onTimeUpdate(): void {
    if (this.videoRef.current) {
      const currentTimeInMinutes = Math.floor(
        this.videoRef.current.currentTime / 60,
      );
      this.setVideoPlayElapsedTimeM(currentTimeInMinutes);
    }
    this.setShowBuffering(false);
  }

  onWaiting(): void {
    this.setShowBuffering(true);
  }

  onSeeking(): void {
    this.setShowBuffering(true);
  }

  onSeeked(): void {
    this.setShowBuffering(false);
  }

  onPlaying(): void {
    this.setShowBuffering(false);
  }

  setupEventListeners(): void {
    console.log('[VideoHandler] Setting up event listeners');
    this.videoRef.current?.addEventListener('loadedmetadata', this.onLoadeMetaData);
    this.videoRef.current?.addEventListener('timeupdate', this.onTimeUpdate);
    this.videoRef.current?.addEventListener('ended', this.onEnded);
    this.videoRef.current?.addEventListener('error', this.onError);
    this.videoRef.current?.addEventListener('waiting', this.onWaiting);
    this.videoRef.current?.addEventListener('seeking', this.onSeeking);
    this.videoRef.current?.addEventListener('seeked', this.onSeeked);
    this.videoRef.current?.addEventListener('playing', this.onPlaying);
  }

  removeEventListeners(): void {
    console.log('[VideoHandler] Removing event listeners');
    this.videoRef.current?.removeEventListener('loadedmetadata', this.onLoadeMetaData);
    this.videoRef.current?.removeEventListener('timeupdate', this.onTimeUpdate);
    this.videoRef.current?.removeEventListener('ended', this.onEnded);
    this.videoRef.current?.removeEventListener('error', this.onError);
    this.videoRef.current?.removeEventListener('waiting', this.onWaiting);
    this.videoRef.current?.removeEventListener('seeking', this.onSeeking);
    this.videoRef.current?.removeEventListener('seeked', this.onSeeked);
    this.videoRef.current?.removeEventListener('playing', this.onPlaying);
  }

  destroyMediaPlayerSync(timeout: number = 1500): boolean {
    console.log('[VideoHandler] destroyMediaPlayerSync - Destroying player...');

    try {
      if (this.videoRef.current) {
        (this.videoRef.current as any).pause?.();
      }

      this.removeEventListeners();

      if (this.player.current) {
        console.log('[VideoHandler] Destroying HLS.js player');
        try {
          this.player.current.unload();
        } catch (e) {
          console.log('[VideoHandler] HLS.js unload error:', e);
        }
        this.player.current = null;
      }

      if (this.videoRef.current) {
        const result: MediaPlayerDeInitStatus =
          this.videoRef.current.deinitializeSync(timeout);

        if (result !== 'success') {
          console.error(`[VideoHandler] Deinit failed: ${result}`);
          return false;
        }

        (global as any).gmedia = null;
        this.videoRef.current = null;
      }

      this.sourceLoaded = false;
      console.log('[VideoHandler] Destruction complete');
      return true;
    } catch (err) {
      console.error('[VideoHandler] Destruction error:', err);
      return false;
    }
  }

  destroyVideoElements(): boolean {
    if (!this.videoRef.current) {
      console.log('[VideoHandler] No video to destroy');
      return false;
    }
    return this.destroyMediaPlayerSync();
  }
}
