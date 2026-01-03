/**
 * TabBar Component
 * Navigation tabs: Live TV, VOD, Series, Favorites, Settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, TABS, TabType } from '../constants/AppConstants';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabItem {
  id: TabType;
  label: string;
  icon: string;
}

const TABS_CONFIG: TabItem[] = [
  { id: TABS.LIVE, label: 'Live TV', icon: '📺' },
  { id: TABS.VOD, label: 'Movies', icon: '🎬' },
  { id: TABS.SERIES, label: 'Series', icon: '📺' },
  { id: TABS.FAVORITES, label: 'Favorites', icon: '⭐' },
  { id: TABS.SETTINGS, label: 'Settings', icon: '⚙️' },
];

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const [focusedTab, setFocusedTab] = useState<TabType | null>(null);

  /**
   * Render single tab
   */
  const renderTab = (tab: TabItem, index: number) => {
    const isActive = activeTab === tab.id;
    const isFocused = focusedTab === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tab,
          isActive && styles.tabActive,
          isFocused && styles.tabFocused,
        ]}
        onPress={() => onTabChange(tab.id)}
        onFocus={() => setFocusedTab(tab.id)}
        onBlur={() => setFocusedTab(null)}
        hasTVPreferredFocus={index === 0 && activeTab === tab.id}
        activeOpacity={0.8}
      >
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        <Text
          style={[
            styles.tabLabel,
            isActive && styles.tabLabelActive,
            isFocused && styles.tabLabelFocused,
          ]}
        >
          {tab.label}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {TABS_CONFIG.map((tab, index) => renderTab(tab, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Platform.isTV ? 48 : 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.isTV ? 24 : 16,
    paddingVertical: 16,
    marginRight: 8,
    borderRadius: 8,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
  },
  tabFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.FOCUS,
  },
  tabIcon: {
    fontSize: Platform.isTV ? 20 : 16,
    marginRight: 8,
  },
  tabLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: Platform.isTV ? 16 : 14,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  tabLabelFocused: {
    color: COLORS.TEXT,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 3,
    backgroundColor: COLORS.PRIMARY,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});

export default TabBar;
