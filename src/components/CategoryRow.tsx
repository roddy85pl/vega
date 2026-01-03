/**
 * CategoryRow Component
 * Horizontal scrollable row of media cards
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, DIMENSIONS } from '../constants/AppConstants';
import { MediaItem } from '../types/XtreamTypes';
import MediaCard from './MediaCard';

interface CategoryRowProps {
  title: string;
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  onPlayPress?: (item: MediaItem) => void;
  isFirstRow?: boolean;
}

const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  items,
  onItemPress,
  onPlayPress,
  isFirstRow = false,
}) => {
  const flatListRef = useRef<FlatList>(null);

  /**
   * Render each media item
   */
  const renderItem = ({ item, index }: { item: MediaItem; index: number }) => (
    <MediaCard
      item={item}
      onPress={() => onItemPress(item)}
      onPlayPress={onPlayPress ? () => onPlayPress(item) : undefined}
      hasTVPreferredFocus={isFirstRow && index === 0}
    />
  );

  /**
   * Key extractor
   */
  const keyExtractor = (item: MediaItem) => item.id;

  /**
   * Get item layout for optimization
   */
  const getItemLayout = (_: any, index: number) => ({
    length: DIMENSIONS.CARD_WIDTH + DIMENSIONS.CARD_MARGIN,
    offset: (DIMENSIONS.CARD_WIDTH + DIMENSIONS.CARD_MARGIN) * index,
    index,
  });

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Category Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Horizontal List */}
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={getItemLayout}
        initialNumToRender={Platform.isTV ? 8 : 5}
        maxToRenderPerBatch={Platform.isTV ? 8 : 5}
        windowSize={Platform.isTV ? 5 : 3}
        removeClippedSubviews={Platform.OS !== 'web'}
        // TV specific
        scrollEnabled={!Platform.isTV} // Let focus system handle scrolling on TV
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL - DIMENSIONS.CARD_MARGIN / 2,
  },
});

export default CategoryRow;
