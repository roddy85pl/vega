/**
 * HlsPlayerWrapper - Wrapper dla HLS.js Player dla Vega OS
 * 
 * Używaj tego zamiast Shaka Player dla lepszej wydajności z HLS streams.
 * 
 * WYMAGANIA:
 * 1. Pobierz HLS.js dla Vega: hls-rel-v1.5.11-r1.5.tar.gz
 * 2. Rozpakuj i uruchom setup.sh
 * 3. Skopiuj pliki do src/hlsjsplayer/
 * 
 * UŻYCIE:
 * import { HlsPlayerWrapper } from './HlsPlayerWrapper';
 * 
 * const hlsPlayer = new HlsPlayerWrapper(videoRef.current);
 * hlsPlayer.load({ uri: 'http://...m3u8', secure: false });
 * await videoRef.current.play();
 */

import { VideoPlayer } from '@amazon-devices/react-native-w3cmedia';
import { HlsJsPlayer } from './hlsjsplayer/HlsJsPlayer';

export interface HlsPlayerConfig {
  uri: string;
  secure?: boolean;
  drm_scheme?: string | null;
  drm_license_uri?: string | null;
}

export class HlsPlayerWrapper {
  private videoPlayer: VideoPlayer;
  private hlsPlayer: HlsJsPlayer | null = null;
  private isLoaded: boolean = false;

  constructor(videoPlayer: VideoPlayer) {
    this.videoPlayer = videoPlayer;
    console.log('[HlsPlayerWrapper] Initialized');
  }

  /**
   * Załaduj stream HLS
   * @param config - Konfiguracja streamu
   * @param autoplay - Czy automatycznie rozpocząć odtwarzanie (default: false)
   */
  load(config: HlsPlayerConfig, autoplay: boolean = false): void {
    console.log('[HlsPlayerWrapper] Loading:', config.uri);

    try {
      // Utwórz instancję HLS.js Player
      this.hlsPlayer = new HlsJsPlayer(this.videoPlayer);

      // Przygotuj konfigurację dla HLS.js
      const hlsConfig = {
        uri: config.uri,
        secure: config.secure ? 'true' : 'false',
        drm_scheme: config.drm_scheme || '',
        drm_license_uri: config.drm_license_uri || '',
      };

      // Załaduj stream
      this.hlsPlayer.load(hlsConfig, autoplay);
      this.isLoaded = true;

      console.log('[HlsPlayerWrapper] Stream loaded successfully');
    } catch (error) {
      console.error('[HlsPlayerWrapper] Error loading stream:', error);
      throw error;
    }
  }

  /**
   * Zatrzymaj i zwolnij zasoby
   */
  unload(): void {
    console.log('[HlsPlayerWrapper] Unloading...');

    if (this.hlsPlayer) {
      try {
        this.hlsPlayer.unload();
      } catch (error) {
        console.error('[HlsPlayerWrapper] Error unloading:', error);
      }
      this.hlsPlayer = null;
    }

    this.isLoaded = false;
    console.log('[HlsPlayerWrapper] Unloaded');
  }

  /**
   * Sprawdź czy stream jest załadowany
   */
  isStreamLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Pobierz instancję HLS.js Player (dla zaawansowanych operacji)
   */
  getPlayer(): HlsJsPlayer | null {
    return this.hlsPlayer;
  }
}

export default HlsPlayerWrapper;
