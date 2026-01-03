// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { ThemeProvider } from '@amazon-devices/kepler-ui-components';
import {
  Platform,
  useHideSplashScreenCallback,
  usePreventHideSplashScreen,
} from '@amazon-devices/react-native-kepler';
import { NavigationContainer } from '@amazon-devices/react-navigation__native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Store } from '@reduxjs/toolkit';
import React, { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import AppStack from './components/navigation/AppStack';
import { initializeStore } from './store';
import { createTheme } from './styles/ThemeBuilders';
import LoginScreen from './screens/LoginScreen';
import xtreamApi from './services/XtreamApiService';
import { STORAGE_KEYS } from './constants/AppConstants';
import { StoredCredentials } from './types/XtreamTypes';

const App = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const isTv = Platform.isTV;
  const preventHideSplashScreen = usePreventHideSplashScreen;
  const hideSplashScreen = useHideSplashScreenCallback();

  if (isTv) {
    preventHideSplashScreen();
  }

  if (__DEV__) {
    hideSplashScreen();
  }

  const initStore = async () => {
    const initializedStore = await initializeStore();
    setStore(initializedStore);
  };

  const checkAuthentication = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (saved) {
        const credentials: StoredCredentials = JSON.parse(saved);
        // Restore credentials to API service
        xtreamApi.setCredentials({
          server: credentials.server,
          username: credentials.username,
          password: credentials.password,
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Failed to check authentication:', err);
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    initStore();
    checkAuthentication();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const theme = useMemo(() => createTheme(), []);

  if (!store || isCheckingAuth) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </ThemeProvider>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <NavigationContainer>
          <AppStack />
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
