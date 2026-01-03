/**
 * Xtream Home Screen
 * Replaces the original HomeScreen with Xtream Codes data
 * Works with existing vega-video-sample player infrastructure
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@amazon-devices/react-navigation__native';
import { Screens } from '../components/navigation/types';
import { COLORS, DIMENSIONS, TABS, TabType } from '../constants/AppConstants';
import { MediaItem, Playlist } from '../types/XtreamTypes';
import { getAllPlaylists, searchContent } from '../services/XtreamDataConverter';
import MediaCard from '../components/MediaCard';
import CategoryRow from '../components/CategoryRow';
import TabBar from '../components/TabBar';
import SearchBar from '../components/SearchBar';

// Convert Xtream MediaItem to vega-video-sample format
const convertToVideoSampleFormat = (item: MediaItem) => ({
  id: item.id,
  title: item.title,
  description: item.description || '',
  posterUrl: item.posterUrl,
  thumbnail: item.posterUrl,
  videoUrl: item.uri,
  uri: item.uri,
  categories: item.categories,
  channelID: item.channelID || item.id,
  rating: item.rating || '',
  mediaType: 'video' as const,
  mediaSourceType: 'url' as const,
  format: item.format,
  secure: false,
  uhd: false,
  // Keep original data for reference
  xtreamData: item,
});

const XtreamHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // State
  const [activeTab, setActiveTab] = useState<TabType>(TABS.LIVE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livePlaylists, setLivePlaylists] = useState<Playlist[]>([]);
  const [vodPlaylists, setVodPlaylists] = useState<Playlist[]>([]);
  const [seriesPlaylists, setSeriesPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Load all content on mount
   */
  useEffect(() => {
    loadContent();
  }, []);

  /**
   * Handle search
   */
  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  /**
   * Load all playlists
   */
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { live, vod, series } = await getAllPlaylists();
      setLivePlaylists(live);
      setVodPlaylists(vod);
      setSeriesPlaylists(series);
    } catch (err: any) {
      console.error('Failed to load content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search content
   */
  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchContent(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handle media item press - navigate to existing DetailsScreen
   */
  const handleMediaPress = useCallback((item: MediaItem) => {
    // Convert to format expected by existing DetailsScreen
    const videoData = convertToVideoSampleFormat(item);
    
    if (item.mediaType === 'series') {
      // Navigate to series details (custom screen)
      navigation.navigate(Screens.XTREAM_SERIES_DETAILS, { 
        seriesId: item.seriesId, 
        item: item 
      });
    } else {
      // Navigate to existing DetailsScreen
      navigation.navigate(Screens.DETAILS_SCREEN, { 
        data: videoData 
      });
    }
  }, [navigation]);

  /**
   * Handle play press (direct play) - navigate to existing PlayerScreen
   */
  const handlePlayPress = useCallback((item: MediaItem) => {
    const videoData = convertToVideoSampleFormat(item);
    navigation.navigate(Screens.PLAYER_SCREEN, { 
      data: videoData 
    });
  }, [navigation]);

  /**
   * Get current playlists based on active tab
   */
  const getCurrentPlaylists = (): Playlist[] => {
    switch (activeTab) {
      case TABS.LIVE:
        return livePlaylists;
      case TABS.VOD:
        return vodPlaylists;
      case TABS.SERIES:
        return seriesPlaylists;
      default:
        return [];
    }
  };

  /**
   * Render search results
   */
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        numColumns={Platform.isTV ? 6 : 3}
        renderItem={({ item, index }) => (
          <MediaCard
            item={item}
            onPress={() => handleMediaPress(item)}
            onPlayPress={() => handlePlayPress(item)}
            hasTVPreferredFocus={index === 0}
          />
        )}
        contentContainerStyle={styles.searchResultsGrid}
      />
    );
  };

  /**
   * Render content
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadContent}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show search results if searching
    if (searchQuery.length > 2) {
      return renderSearchResults();
    }

    const playlists = getCurrentPlaylists();

    if (playlists.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No content available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {playlists.map((playlist, index) => (
          <CategoryRow
            key={playlist.categoryId || index}
            title={playlist.playlistName}
            items={playlist.medias}
            onItemPress={handleMediaPress}
            onPlayPress={handlePlayPress}
            isFirstRow={index === 0}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>PolFun Box</Text>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search..."
        />
      </View>

      {/* Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingVertical: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResultsGrid: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
  },
});

export default XtreamHomeScreen;
