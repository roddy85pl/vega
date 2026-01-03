/**
 * Xtream Codes API Service for Vega OS
 * Handles all communication with Xtream UI / XUI panels
 */

import {
  XtreamCredentials,
  XtreamAuthResponse,
  XtreamCategory,
  XtreamLiveStream,
  XtreamVodStream,
  XtreamVodInfo,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamShortEpg,
  MediaItem,
  Playlist,
} from '../types/XtreamTypes';

class XtreamApiService {
  private credentials: XtreamCredentials | null = null;
  private baseUrl: string = '';

  /**
   * Initialize service with credentials
   */
  setCredentials(credentials: XtreamCredentials): void {
    this.credentials = credentials;
    // Ensure proper URL format
    let server = credentials.server.trim();
    if (!server.startsWith('http://') && !server.startsWith('https://')) {
      server = 'http://' + server;
    }
    // Remove trailing slash
    this.baseUrl = server.replace(/\/$/, '');
  }

  /**
   * Get current credentials
   */
  getCredentials(): XtreamCredentials | null {
    return this.credentials;
  }

  /**
   * Check if logged in
   */
  isLoggedIn(): boolean {
    return this.credentials !== null;
  }

  /**
   * Build API URL with authentication
   */
  private buildUrl(action?: string, params: Record<string, string> = {}): string {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    const queryParams = new URLSearchParams({
      username: this.credentials.username,
      password: this.credentials.password,
      ...params,
    });

    if (action) {
      queryParams.set('action', action);
    }

    return `${this.baseUrl}/player_api.php?${queryParams.toString()}`;
  }

  /**
   * Build stream URL
   */
  buildStreamUrl(
    streamId: number,
    type: 'live' | 'movie' | 'series',
    extension: string = 'm3u8'
  ): string {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    const { username, password } = this.credentials;

    switch (type) {
      case 'live':
        return `${this.baseUrl}/live/${username}/${password}/${streamId}.${extension}`;
      case 'movie':
        return `${this.baseUrl}/movie/${username}/${password}/${streamId}.${extension}`;
      case 'series':
        return `${this.baseUrl}/series/${username}/${password}/${streamId}.${extension}`;
      default:
        return `${this.baseUrl}/${type}/${username}/${password}/${streamId}.${extension}`;
    }
  }

  /**
   * Fetch with timeout and error handling
   */
  private async fetchApi<T>(url: string, timeout: number = 15000): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VegaOS-IPTV/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ===== AUTHENTICATION =====

  /**
   * Authenticate with Xtream server
   */
  async authenticate(credentials: XtreamCredentials): Promise<XtreamAuthResponse> {
    this.setCredentials(credentials);
    const url = this.buildUrl();
    
    const response = await this.fetchApi<XtreamAuthResponse>(url);
    
    if (!response.user_info || response.user_info.auth !== 1) {
      throw new Error('Authentication failed');
    }

    return response;
  }

  /**
   * Logout - clear credentials
   */
  logout(): void {
    this.credentials = null;
    this.baseUrl = '';
  }

  // ===== CATEGORIES =====

  /**
   * Get live TV categories
   */
  async getLiveCategories(): Promise<XtreamCategory[]> {
    const url = this.buildUrl('get_live_categories');
    return this.fetchApi<XtreamCategory[]>(url);
  }

  /**
   * Get VOD categories
   */
  async getVodCategories(): Promise<XtreamCategory[]> {
    const url = this.buildUrl('get_vod_categories');
    return this.fetchApi<XtreamCategory[]>(url);
  }

  /**
   * Get Series categories
   */
  async getSeriesCategories(): Promise<XtreamCategory[]> {
    const url = this.buildUrl('get_series_categories');
    return this.fetchApi<XtreamCategory[]>(url);
  }

  // ===== LIVE STREAMS =====

  /**
   * Get all live streams
   */
  async getLiveStreams(categoryId?: string): Promise<XtreamLiveStream[]> {
    const params: Record<string, string> = {};
    if (categoryId) {
      params.category_id = categoryId;
    }
    const url = this.buildUrl('get_live_streams', params);
    return this.fetchApi<XtreamLiveStream[]>(url);
  }

  // ===== VOD =====

  /**
   * Get all VOD streams
   */
  async getVodStreams(categoryId?: string): Promise<XtreamVodStream[]> {
    const params: Record<string, string> = {};
    if (categoryId) {
      params.category_id = categoryId;
    }
    const url = this.buildUrl('get_vod_streams', params);
    return this.fetchApi<XtreamVodStream[]>(url);
  }

  /**
   * Get VOD info by ID
   */
  async getVodInfo(vodId: number): Promise<XtreamVodInfo> {
    const url = this.buildUrl('get_vod_info', { vod_id: vodId.toString() });
    return this.fetchApi<XtreamVodInfo>(url);
  }

  // ===== SERIES =====

  /**
   * Get all series
   */
  async getSeries(categoryId?: string): Promise<XtreamSeries[]> {
    const params: Record<string, string> = {};
    if (categoryId) {
      params.category_id = categoryId;
    }
    const url = this.buildUrl('get_series', params);
    return this.fetchApi<XtreamSeries[]>(url);
  }

  /**
   * Get series info with episodes
   */
  async getSeriesInfo(seriesId: number): Promise<XtreamSeriesInfo> {
    const url = this.buildUrl('get_series_info', { series_id: seriesId.toString() });
    return this.fetchApi<XtreamSeriesInfo>(url);
  }

  // ===== EPG =====

  /**
   * Get short EPG for a stream
   */
  async getShortEpg(streamId: number, limit: number = 10): Promise<XtreamShortEpg> {
    const url = this.buildUrl('get_short_epg', {
      stream_id: streamId.toString(),
      limit: limit.toString(),
    });
    return this.fetchApi<XtreamShortEpg>(url);
  }

  /**
   * Get simple data table EPG
   */
  async getSimpleDataTable(streamId: number): Promise<XtreamShortEpg> {
    const url = this.buildUrl('get_simple_data_table', {
      stream_id: streamId.toString(),
    });
    return this.fetchApi<XtreamShortEpg>(url);
  }

  // ===== CATCHUP / ARCHIVE =====

  /**
   * Build catchup/archive URL
   */
  buildCatchupUrl(
    streamId: number,
    start: string,
    duration: number,
    extension: string = 'm3u8'
  ): string {
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    const { username, password } = this.credentials;
    // Format: /streaming/timeshift.php?username=X&password=X&stream=ID&start=TIMESTAMP&duration=MINUTES
    return `${this.baseUrl}/streaming/timeshift.php?username=${username}&password=${password}&stream=${streamId}&start=${start}&duration=${duration}`;
  }
}

// Singleton instance
export const xtreamApi = new XtreamApiService();
export default xtreamApi;
