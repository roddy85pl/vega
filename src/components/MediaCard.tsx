/**
 * MediaCard Component
 * Displays poster/thumbnail for media items
 * TV-optimized with focus management
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { COLORS, DIMENSIONS, TIMING } from '../constants/AppConstants';
import { MediaItem } from '../types/XtreamTypes';

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
  onPlayPress?: () => void;
  hasTVPreferredFocus?: boolean;
  width?: number;
  height?: number;
}

const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onPress,
  onPlayPress,
  hasTVPreferredFocus = false,
  width = DIMENSIONS.CARD_WIDTH,
  height = DIMENSIONS.CARD_HEIGHT,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * Handle focus
   */
  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: DIMENSIONS.FOCUS_SCALE,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle blur
   */
  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Get badge color based on media type
   */
  const getBadgeColor = () => {
    switch (item.mediaType) {
      case 'live':
        return COLORS.LIVE_TV;
      case 'vod':
        return COLORS.VOD;
      case 'series':
      case 'episode':
        return COLORS.SERIES;
      default:
        return COLORS.PRIMARY;
    }
  };

  /**
   * Get badge text
   */
  const getBadgeText = () => {
    switch (item.mediaType) {
      case 'live':
        return 'LIVE';
      case 'episode':
        return `S${item.seasonNumber}E${item.episodeNumber}`;
      default:
        return '';
    }
  };

  /**
   * Render placeholder if no image
   */
  const renderPlaceholder = () => (
    <View style={[styles.placeholder, { width, height: height * 0.7 }]}>
      <Text style={styles.placeholderText}>
        {item.title.substring(0, 2).toUpperCase()}
      </Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          isFocused && styles.cardFocused,
        ]}
        onPress={onPress}
        onLongPress={onPlayPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        activeOpacity={0.9}
      >
        {/* Poster Image */}
        <View style={[styles.imageContainer, { height: height * 0.7 }]}>
          {item.posterUrl && !imageError ? (
            <Image
              source={{ uri: item.posterUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            renderPlaceholder()
          )}

          {/* Badge */}
          {getBadgeText() && (
            <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
              <Text style={styles.badgeText}>{getBadgeText()}</Text>
            </View>
          )}

          {/* Play overlay on focus */}
          {isFocused && (
            <View style={styles.playOverlay}>
              <View style={styles.playButton}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {item.year && (
            <Text style={styles.year}>{item.year}</Text>
          )}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {item.rating}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: DIMENSIONS.CARD_MARGIN / 2,
  },
  card: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: COLORS.FOCUS,
    shadowColor: COLORS.FOCUS,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT_MUTED,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: COLORS.WHITE,
    fontSize: 20,
    marginLeft: 4,
  },
  infoContainer: {
    padding: 8,
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  year: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: COLORS.WARNING,
    fontSize: 12,
  },
});

export default MediaCard;
