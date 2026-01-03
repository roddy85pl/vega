/**
 * Xtream Data Converter
 * Converts Xtream API responses to Vega Video Sample App format
 */

import {
  XtreamLiveStream,
  XtreamVodStream,
  XtreamVodInfo,
  XtreamSeries,
  XtreamSeriesInfo,
  XtreamEpisode,
  XtreamCategory,
  MediaItem,
  Playlist,
} from '../types/XtreamTypes';
import xtreamApi from './XtreamApiService';

/**
 * Determine format based on container extension
 */
function getFormat(extension?: string): 'HLS' | 'DASH' | 'MP4' | 'MKV' | 'AVI' {
  if (!extension) return 'HLS';
  
  const ext = extension.toLowerCase();
  switch (ext) {
    case 'm3u8':
    case 'ts':
      return 'HLS';
    case 'mpd':
      return 'DASH';
    case 'mkv':
      return 'MKV';
    case 'avi':
      return 'AVI';
    case 'mp4':
    default:
      return 'MP4';
  }
}

/**
 * Convert live stream to MediaItem
 */
export function convertLiveStream(
  stream: XtreamLiveStream,
  categories: XtreamCategory[]
): MediaItem {
  const categoryName = categories.find(
    c => c.category_id === stream.category_id
  )?.category_name || 'Live TV';

  // Use HLS for live streams
  const streamUrl = xtreamApi.buildStreamUrl(stream.stream_id, 'live', 'm3u8');

  return {
    id: `live_${stream.stream_id}`,
    title: stream.name,
    description: '',
    posterUrl: stream.stream_icon || '',
    uri: streamUrl,
    format: 'HLS',
    categories: [categoryName],
    channelID: stream.epg_channel_id || stream.stream_id.toString(),
    isAdult: stream.is_adult === '1',
    mediaType: 'live',
    streamId: stream.stream_id,
    hasArchive: stream.tv_archive === 1,
    archiveDuration: stream.tv_archive_duration,
  };
}

/**
 * Convert VOD stream to MediaItem
 */
export function convertVodStream(
  vod: XtreamVodStream,
  categories: XtreamCategory[]
): MediaItem {
  const categoryName = categories.find(
    c => c.category_id === vod.category_id
  )?.category_name || 'Movies';

  const extension = vod.container_extension || 'mp4';
  const streamUrl = xtreamApi.buildStreamUrl(vod.stream_id, 'movie', extension);

  return {
    id: `vod_${vod.stream_id}`,
    title: vod.name,
    description: '',
    posterUrl: vod.stream_icon || '',
    uri: streamUrl,
    format: getFormat(extension),
    categories: [categoryName],
    rating: vod.rating || '',
    isAdult: vod.is_adult === '1',
    mediaType: 'vod',
    streamId: vod.stream_id,
    containerExtension: extension,
  };
}

/**
 * Convert VOD with full info to MediaItem
 */
export function convertVodInfo(vodInfo: XtreamVodInfo): MediaItem {
  const { info, movie_data } = vodInfo;
  const extension = movie_data.container_extension || 'mp4';
  const streamUrl = xtreamApi.buildStreamUrl(movie_data.stream_id, 'movie', extension);

  return {
    id: `vod_${movie_data.stream_id}`,
    title: info.name || movie_data.name,
    description: info.description || info.plot || '',
    posterUrl: info.cover_big || info.movie_image || '',
    backdropUrl: info.backdrop_path?.[0] || '',
    uri: streamUrl,
    format: getFormat(extension),
    categories: info.genre ? info.genre.split(',').map(g => g.trim()) : ['Movies'],
    rating: info.rating_count_kinopoisk || '',
    duration: info.duration_secs,
    year: info.release_date?.substring(0, 4) || '',
    genre: info.genre || '',
    cast: info.actors || info.cast || '',
    director: info.director || '',
    isAdult: false,
    mediaType: 'vod',
    streamId: movie_data.stream_id,
    containerExtension: extension,
  };
}

/**
 * Convert series to MediaItem (for listing)
 */
export function convertSeries(
  series: XtreamSeries,
  categories: XtreamCategory[]
): MediaItem {
  const categoryName = categories.find(
    c => c.category_id === series.category_id
  )?.category_name || 'Series';

  return {
    id: `series_${series.series_id}`,
    title: series.name,
    description: series.plot || '',
    posterUrl: series.cover || '',
    backdropUrl: series.backdrop_path?.[0] || '',
    uri: '', // Series don't have direct URI, episodes do
    format: 'MP4',
    categories: [categoryName],
    rating: series.rating || '',
    year: series.release_date?.substring(0, 4) || '',
    genre: series.genre || '',
    cast: series.cast || '',
    director: series.director || '',
    isAdult: false,
    mediaType: 'series',
    seriesId: series.series_id,
  };
}

/**
 * Convert episode to MediaItem
 */
export function convertEpisode(
  episode: XtreamEpisode,
  seriesInfo: XtreamSeriesInfo,
  seasonNumber: number
): MediaItem {
  const extension = episode.container_extension || 'mp4';
  const streamUrl = xtreamApi.buildStreamUrl(parseInt(episode.id), 'series', extension);

  return {
    id: `episode_${episode.id}`,
    title: episode.title || `Episode ${episode.episode_num}`,
    description: episode.info?.plot || '',
    posterUrl: episode.info?.movie_image || seriesInfo.info.cover || '',
    backdropUrl: seriesInfo.info.backdrop_path?.[0] || '',
    uri: streamUrl,
    format: getFormat(extension),
    categories: seriesInfo.info.genre ? seriesInfo.info.genre.split(',').map(g => g.trim()) : ['Series'],
    rating: episode.info?.rating || seriesInfo.info.rating || '',
    duration: episode.info?.duration_secs,
    year: episode.info?.release_date?.substring(0, 4) || '',
    isAdult: false,
    mediaType: 'episode',
    streamId: parseInt(episode.id),
    seriesId: undefined, // Will be set by caller
    seasonNumber: seasonNumber,
    episodeNumber: episode.episode_num,
    containerExtension: extension,
  };
}

/**
 * Convert live streams to playlist by category
 */
export async function getLivePlaylists(): Promise<Playlist[]> {
  const [categories, streams] = await Promise.all([
    xtreamApi.getLiveCategories(),
    xtreamApi.getLiveStreams(),
  ]);

  const playlists: Playlist[] = [];

  // Group by category
  const categoryMap = new Map<string, XtreamLiveStream[]>();
  
  for (const stream of streams) {
    const catId = stream.category_id || 'uncategorized';
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, []);
    }
    categoryMap.get(catId)!.push(stream);
  }

  // Create playlist for each category
  for (const [catId, catStreams] of categoryMap) {
    const category = categories.find(c => c.category_id === catId);
    const categoryName = category?.category_name || 'Other';

    playlists.push({
      playlistName: categoryName,
      categoryId: catId,
      medias: catStreams.map(s => convertLiveStream(s, categories)),
    });
  }

  return playlists;
}

/**
 * Convert VOD streams to playlist by category
 */
export async function getVodPlaylists(): Promise<Playlist[]> {
  const [categories, streams] = await Promise.all([
    xtreamApi.getVodCategories(),
    xtreamApi.getVodStreams(),
  ]);

  const playlists: Playlist[] = [];
  const categoryMap = new Map<string, XtreamVodStream[]>();

  for (const stream of streams) {
    const catId = stream.category_id || 'uncategorized';
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, []);
    }
    categoryMap.get(catId)!.push(stream);
  }

  for (const [catId, catStreams] of categoryMap) {
    const category = categories.find(c => c.category_id === catId);
    const categoryName = category?.category_name || 'Other';

    playlists.push({
      playlistName: categoryName,
      categoryId: catId,
      medias: catStreams.map(v => convertVodStream(v, categories)),
    });
  }

  return playlists;
}

/**
 * Convert series to playlist by category
 */
export async function getSeriesPlaylists(): Promise<Playlist[]> {
  const [categories, series] = await Promise.all([
    xtreamApi.getSeriesCategories(),
    xtreamApi.getSeries(),
  ]);

  const playlists: Playlist[] = [];
  const categoryMap = new Map<string, XtreamSeries[]>();

  for (const s of series) {
    const catId = s.category_id || 'uncategorized';
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, []);
    }
    categoryMap.get(catId)!.push(s);
  }

  for (const [catId, catSeries] of categoryMap) {
    const category = categories.find(c => c.category_id === catId);
    const categoryName = category?.category_name || 'Other';

    playlists.push({
      playlistName: categoryName,
      categoryId: catId,
      medias: catSeries.map(s => convertSeries(s, categories)),
    });
  }

  return playlists;
}

/**
 * Get all playlists (live, vod, series combined)
 */
export async function getAllPlaylists(): Promise<{
  live: Playlist[];
  vod: Playlist[];
  series: Playlist[];
}> {
  const [live, vod, series] = await Promise.all([
    getLivePlaylists(),
    getVodPlaylists(),
    getSeriesPlaylists(),
  ]);

  return { live, vod, series };
}

/**
 * Search across all content
 */
export async function searchContent(query: string): Promise<MediaItem[]> {
  const searchLower = query.toLowerCase();
  const results: MediaItem[] = [];

  try {
    const { live, vod, series } = await getAllPlaylists();

    // Search live
    for (const playlist of live) {
      for (const media of playlist.medias) {
        if (media.title.toLowerCase().includes(searchLower)) {
          results.push(media);
        }
      }
    }

    // Search VOD
    for (const playlist of vod) {
      for (const media of playlist.medias) {
        if (media.title.toLowerCase().includes(searchLower)) {
          results.push(media);
        }
      }
    }

    // Search Series
    for (const playlist of series) {
      for (const media of playlist.medias) {
        if (media.title.toLowerCase().includes(searchLower)) {
          results.push(media);
        }
      }
    }
  } catch (error) {
    console.error('Search error:', error);
  }

  return results;
}

export default {
  convertLiveStream,
  convertVodStream,
  convertVodInfo,
  convertSeries,
  convertEpisode,
  getLivePlaylists,
  getVodPlaylists,
  getSeriesPlaylists,
  getAllPlaylists,
  searchContent,
};
