/**
 * Xtream Codes API Types for Vega OS
 * Compatible with XUI / Xtream UI panels
 */

// ===== AUTH TYPES =====
export interface XtreamCredentials {
  server: string;
  username: string;
  password: string;
}

export interface XtreamUserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface XtreamServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface XtreamAuthResponse {
  user_info: XtreamUserInfo;
  server_info: XtreamServerInfo;
}

// ===== CATEGORY TYPES =====
export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

// ===== LIVE STREAM TYPES =====
export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids?: number[];
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

// ===== VOD TYPES =====
export interface XtreamVodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids?: number[];
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface XtreamVodInfo {
  info: {
    kinopoisk_url?: string;
    tmdb_id?: string;
    name: string;
    o_name?: string;
    cover_big?: string;
    movie_image?: string;
    release_date?: string;
    episode_run_time?: string;
    youtube_trailer?: string;
    director?: string;
    actors?: string;
    cast?: string;
    description?: string;
    plot?: string;
    age?: string;
    mpaa_rating?: string;
    rating_count_kinopoisk?: string;
    country?: string;
    genre?: string;
    backdrop_path?: string[];
    duration_secs?: number;
    duration?: string;
    bitrate?: number;
    video?: {
      codec_name?: string;
      width?: number;
      height?: number;
    };
    audio?: {
      codec_name?: string;
      channels?: number;
    };
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

// ===== SERIES TYPES =====
export interface XtreamSeries {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  release_date: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path?: string[];
  youtube_trailer?: string;
  episode_run_time?: string;
  category_id: string;
  category_ids?: number[];
}

export interface XtreamSeriesInfo {
  seasons: XtreamSeason[];
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    release_date: string;
    rating: string;
    rating_5based: number;
    backdrop_path?: string[];
    youtube_trailer?: string;
    episode_run_time?: string;
    category_id: string;
  };
  episodes: { [seasonNum: string]: XtreamEpisode[] };
}

export interface XtreamSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover?: string;
  cover_big?: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  info: {
    movie_image?: string;
    plot?: string;
    release_date?: string;
    rating?: string;
    duration_secs?: number;
    duration?: string;
    bitrate?: number;
    video?: {
      codec_name?: string;
      width?: number;
      height?: number;
    };
    audio?: {
      codec_name?: string;
      channels?: number;
    };
  };
  custom_sid: string;
  added: string;
  season: number;
  direct_source: string;
}

// ===== EPG TYPES =====
export interface XtreamEpgListing {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
  now_playing?: number;
  has_archive?: number;
}

export interface XtreamShortEpg {
  epg_listings: XtreamEpgListing[];
}

// ===== UNIFIED MEDIA ITEM =====
export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  posterUrl: string;
  backdropUrl?: string;
  uri: string;
  format: 'HLS' | 'DASH' | 'MP4' | 'MKV' | 'AVI';
  categories: string[];
  channelID?: string;
  rating?: string;
  duration?: number;
  year?: string;
  genre?: string;
  cast?: string;
  director?: string;
  isAdult?: boolean;
  mediaType: 'live' | 'vod' | 'series' | 'episode';
  // Xtream specific
  streamId?: number;
  seriesId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  containerExtension?: string;
  // EPG for live
  currentProgram?: string;
  nextProgram?: string;
  // Archive/Catchup
  hasArchive?: boolean;
  archiveDuration?: number;
}

export interface Playlist {
  playlistName: string;
  categoryId?: string;
  medias: MediaItem[];
}

// ===== STORAGE TYPES =====
export interface StoredCredentials {
  server: string;
  username: string;
  password: string;
  userInfo?: XtreamUserInfo;
  serverInfo?: XtreamServerInfo;
  lastLogin?: number;
}
