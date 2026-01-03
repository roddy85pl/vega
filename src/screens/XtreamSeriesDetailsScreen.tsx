/**
 * Xtream Series Details Screen
 * Shows series info with seasons and episodes
 * Integrates with existing vega-video-sample player
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@amazon-devices/react-navigation__native';
import LinearGradient from '@amazon-devices/react-linear-gradient';
import { COLORS, DIMENSIONS } from '../constants/AppConstants';
import { MediaItem, XtreamSeriesInfo, XtreamEpisode } from '../types/XtreamTypes';
import xtreamApi from '../services/XtreamApiService';
import { convertEpisode } from '../services/XtreamDataConverter';

// Convert episode to vega-video-sample format
const convertToVideoSampleFormat = (item: MediaItem) => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  posterUrl: item.posterUrl,
  thumbnail: item.posterUrl,
  videoUrl: item.uri,
  uri: item.uri,
  categories: item.categories,
  channelID: item.id,
  rating: item.rating || '',
  mediaType: 'video' as const,
  mediaSourceType: 'url' as const,
  format: item.format,
  secure: false,
  uhd: false,
});

const XtreamSeriesDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { seriesId, item } = route.params as { seriesId: number; item: MediaItem };

  const [seriesInfo, setSeriesInfo] = useState<XtreamSeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);

  useEffect(() => {
    loadSeriesInfo();
  }, [seriesId]);

  useEffect(() => {
    if (seriesInfo) {
      loadEpisodes(selectedSeason);
    }
  }, [selectedSeason, seriesInfo]);

  const loadSeriesInfo = async () => {
    try {
      setIsLoading(true);
      const info = await xtreamApi.getSeriesInfo(seriesId);
      setSeriesInfo(info);

      if (info.seasons && info.seasons.length > 0) {
        setSelectedSeason(info.seasons[0].season_number);
      }
    } catch (err) {
      console.error('Failed to load series info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpisodes = (seasonNum: number) => {
    if (!seriesInfo) return;

    const seasonKey = seasonNum.toString();
    const seasonEpisodes = seriesInfo.episodes[seasonKey] || [];
    
    const convertedEpisodes = seasonEpisodes.map((ep: XtreamEpisode) =>
      convertEpisode(ep, seriesInfo, seasonNum)
    );

    setEpisodes(convertedEpisodes);
  };

  const handleEpisodePress = (episode: MediaItem) => {
    const videoData = convertToVideoSampleFormat(episode);
    // Navigate to existing PlayerScreen from vega-video-sample
    navigation.navigate('PlayerScreen', { data: videoData });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSeasonSelector = () => {
    if (!seriesInfo?.seasons || seriesInfo.seasons.length === 0) {
      return null;
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.seasonsScroll}
        contentContainerStyle={styles.seasonsContent}
      >
        {seriesInfo.seasons.map((season, index) => (
          <TouchableOpacity
            key={season.season_number}
            style={[
              styles.seasonButton,
              selectedSeason === season.season_number && styles.seasonButtonActive,
            ]}
            onPress={() => setSelectedSeason(season.season_number)}
            hasTVPreferredFocus={index === 0}
          >
            <Text
              style={[
                styles.seasonButtonText,
                selectedSeason === season.season_number && styles.seasonButtonTextActive,
              ]}
            >
              Season {season.season_number}
            </Text>
            <Text style={styles.episodeCount}>
              {season.episode_count} episodes
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderEpisode = ({ item: episode, index }: { item: MediaItem; index: number }) => (
    <TouchableOpacity
      style={styles.episodeCard}
      onPress={() => handleEpisodePress(episode)}
      hasTVPreferredFocus={index === 0 && !seriesInfo?.seasons?.length}
    >
      <View style={styles.episodeThumbnailContainer}>
        {episode.posterUrl ? (
          <Image
            source={{ uri: episode.posterUrl }}
            style={styles.episodeThumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.episodeThumbnailPlaceholder}>
            <Text style={styles.episodeNumber}>E{episode.episodeNumber}</Text>
          </View>
        )}
        <View style={styles.episodePlayOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      </View>

      <View style={styles.episodeInfo}>
        <Text style={styles.episodeTitle} numberOfLines={2}>
          {episode.episodeNumber}. {episode.title}
        </Text>
        {episode.duration && (
          <Text style={styles.episodeDuration}>
            {Math.floor(episode.duration / 60)} min
          </Text>
        )}
        {episode.description && (
          <Text style={styles.episodeDescription} numberOfLines={2}>
            {episode.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const displayItem = seriesInfo ? {
    ...item,
    title: seriesInfo.info.name || item.title,
    description: seriesInfo.info.plot || item.description,
    posterUrl: seriesInfo.info.cover || item.posterUrl,
    backdropUrl: seriesInfo.info.backdrop_path?.[0] || item.backdropUrl,
    genre: seriesInfo.info.genre || item.genre,
    cast: seriesInfo.info.cast || item.cast,
    director: seriesInfo.info.director || item.director,
    rating: seriesInfo.info.rating || item.rating,
    year: seriesInfo.info.release_date?.substring(0, 4) || item.year,
  } : item;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: displayItem.backdropUrl || displayItem.posterUrl }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', COLORS.BACKGROUND]}
          style={styles.gradient}
        />
      </ImageBackground>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={styles.posterContainer}>
              {displayItem.posterUrl ? (
                <Image
                  source={{ uri: displayItem.posterUrl }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.posterPlaceholderText}>
                    {displayItem.title.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.seriesInfo}>
              <Text style={styles.title}>{displayItem.title}</Text>
              
              <View style={styles.metaRow}>
                {displayItem.year && (
                  <Text style={styles.metaText}>{displayItem.year}</Text>
                )}
                {displayItem.rating && (
                  <Text style={styles.ratingText}>★ {displayItem.rating}</Text>
                )}
                {seriesInfo && (
                  <Text style={styles.metaText}>
                    {seriesInfo.seasons?.length || 0} Seasons
                  </Text>
                )}
              </View>

              {displayItem.genre && (
                <Text style={styles.genres}>{displayItem.genre}</Text>
              )}

              {displayItem.description && (
                <Text style={styles.description} numberOfLines={4}>
                  {displayItem.description}
                </Text>
              )}
            </View>
          </View>

          {renderSeasonSelector()}

          <View style={styles.episodesSection}>
            <Text style={styles.sectionTitle}>
              Episodes ({episodes.length})
            </Text>
            <FlatList
              data={episodes}
              keyExtractor={(ep) => ep.id}
              renderItem={renderEpisode}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.episodeSeparator} />}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: Platform.isTV ? 60 : 40,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  backIcon: {
    color: COLORS.WHITE,
    fontSize: 24,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  posterContainer: {
    width: 180,
    height: 270,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 24,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.CARD_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.TEXT_MUTED,
  },
  seriesInfo: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginRight: 16,
  },
  ratingText: {
    color: COLORS.WARNING,
    fontSize: 14,
    marginRight: 16,
  },
  genres: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    marginBottom: 12,
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 22,
  },
  seasonsScroll: {
    marginBottom: 24,
  },
  seasonsContent: {
    paddingVertical: 8,
  },
  seasonButton: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  seasonButtonActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  seasonButtonText: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  seasonButtonTextActive: {
    color: COLORS.WHITE,
  },
  episodeCount: {
    color: COLORS.TEXT_MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  episodesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 16,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 8,
    overflow: 'hidden',
  },
  episodeThumbnailContainer: {
    width: 160,
    height: 90,
    position: 'relative',
  },
  episodeThumbnail: {
    width: '100%',
    height: '100%',
  },
  episodeThumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.CARD_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_MUTED,
  },
  episodePlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: COLORS.WHITE,
    fontSize: 24,
  },
  episodeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  episodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  episodeDuration: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginBottom: 4,
  },
  episodeDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  episodeSeparator: {
    height: 12,
  },
});

export default XtreamSeriesDetailsScreen;
