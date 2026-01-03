/**
 * App Constants
 * Colors, storage keys, and configuration
 */

export const COLORS = {
  // Primary colors
  PRIMARY: '#E50914', // Netflix red
  PRIMARY_DARK: '#B81D24',
  SECONDARY: '#564D4D',
  
  // Background colors
  BACKGROUND: '#141414',
  CARD_BACKGROUND: '#1F1F1F',
  INPUT_BACKGROUND: '#2C2C2C',
  OVERLAY: 'rgba(0, 0, 0, 0.7)',
  
  // Text colors
  TEXT: '#FFFFFF',
  TEXT_SECONDARY: '#B3B3B3',
  TEXT_MUTED: '#757575',
  PLACEHOLDER: '#666666',
  
  // Status colors
  ERROR: '#FF4444',
  ERROR_BACKGROUND: 'rgba(255, 68, 68, 0.1)',
  SUCCESS: '#4CAF50',
  WARNING: '#FFC107',
  
  // UI colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  BORDER: '#333333',
  FOCUS: '#E50914',
  HIGHLIGHT: '#E50914',
  
  // Category colors
  LIVE_TV: '#4CAF50',
  VOD: '#2196F3',
  SERIES: '#9C27B0',
};

export const STORAGE_KEYS = {
  CREDENTIALS: '@polfunbox_credentials',
  FAVORITES: '@polfunbox_favorites',
  WATCH_HISTORY: '@polfunbox_watch_history',
  SETTINGS: '@polfunbox_settings',
  LAST_CHANNEL: '@polfunbox_last_channel',
  EPG_CACHE: '@polfunbox_epg_cache',
};

export const DIMENSIONS = {
  // Card sizes for TV
  CARD_WIDTH: 200,
  CARD_HEIGHT: 300,
  CARD_WIDTH_SMALL: 160,
  CARD_HEIGHT_SMALL: 240,
  
  // Poster ratios
  POSTER_RATIO: 1.5, // 2:3
  BACKDROP_RATIO: 0.5625, // 16:9
  
  // Spacing
  PADDING_HORIZONTAL: 48,
  PADDING_VERTICAL: 24,
  CARD_MARGIN: 16,
  
  // Focus ring
  FOCUS_SCALE: 1.1,
  FOCUS_BORDER_WIDTH: 3,
};

export const TIMING = {
  // Animation durations
  FOCUS_ANIMATION: 200,
  TRANSITION: 300,
  
  // API timeouts
  API_TIMEOUT: 15000,
  EPG_REFRESH: 300000, // 5 minutes
  
  // UI delays
  SCROLL_DEBOUNCE: 100,
  SEARCH_DEBOUNCE: 500,
};

export const API_CONFIG = {
  // Default extensions
  LIVE_EXTENSION: 'm3u8',
  VOD_EXTENSION: 'mp4',
  
  // Output formats
  OUTPUT_FORMATS: ['m3u8', 'ts', 'mp4'],
  
  // User agent
  USER_AGENT: 'VegaOS-IPTV/1.0 PolFunBox',
};

export const TABS = {
  LIVE: 'live',
  VOD: 'vod',
  SERIES: 'series',
  FAVORITES: 'favorites',
  SETTINGS: 'settings',
} as const;

export type TabType = typeof TABS[keyof typeof TABS];

export default {
  COLORS,
  STORAGE_KEYS,
  DIMENSIONS,
  TIMING,
  API_CONFIG,
  TABS,
};
