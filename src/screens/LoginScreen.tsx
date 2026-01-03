/**
 * Login Screen for Xtream API
 * TV-optimized with focus management
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  findNodeHandle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import xtreamApi from '../services/XtreamApiService';
import { XtreamCredentials, StoredCredentials } from '../types/XtreamTypes';
import { STORAGE_KEYS, COLORS } from '../constants/AppConstants';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [server, setServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for focus management
  const serverInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const loginButtonRef = useRef<TouchableOpacity>(null);

  /**
   * Load saved credentials on mount
   */
  React.useEffect(() => {
    loadSavedCredentials();
  }, []);

  /**
   * Load credentials from storage
   */
  const loadSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (saved) {
        const credentials: StoredCredentials = JSON.parse(saved);
        setServer(credentials.server || '');
        setUsername(credentials.username || '');
        setPassword(credentials.password || '');
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    }
  };

  /**
   * Save credentials to storage
   */
  const saveCredentials = async (credentials: XtreamCredentials) => {
    try {
      const toSave: StoredCredentials = {
        ...credentials,
        lastLogin: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(toSave));
    } catch (err) {
      console.error('Failed to save credentials:', err);
    }
  };

  /**
   * Handle login
   */
  const handleLogin = async () => {
    // Validate inputs
    if (!server.trim()) {
      setError('Server address is required');
      return;
    }
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    const credentials: XtreamCredentials = {
      server: server.trim(),
      username: username.trim(),
      password: password.trim(),
    };

    try {
      const authResponse = await xtreamApi.authenticate(credentials);
      
      // Check account status
      if (authResponse.user_info.status !== 'Active') {
        throw new Error(`Account status: ${authResponse.user_info.status}`);
      }

      // Check expiration
      const expDate = new Date(parseInt(authResponse.user_info.exp_date) * 1000);
      if (expDate < new Date()) {
        throw new Error('Account has expired');
      }

      // Save credentials
      await saveCredentials(credentials);

      // Success!
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request TV focus on element
   */
  const requestFocus = (ref: React.RefObject<any>) => {
    if (Platform.isTV && ref.current) {
      const node = findNodeHandle(ref.current);
      if (node) {
        // @ts-ignore - TV specific API
        ref.current.requestTVFocus?.();
      }
    }
  };

  /**
   * Focus styles for TV
   */
  const getFocusStyle = (isFocused: boolean) => ({
    borderColor: isFocused ? COLORS.PRIMARY : COLORS.BORDER,
    borderWidth: isFocused ? 3 : 1,
  });

  return (
    <View style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>PolFun Box</Text>
        <Text style={styles.subtitle}>IPTV Player for Vega OS</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Server Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Server</Text>
          <TextInput
            ref={serverInputRef}
            style={styles.input}
            placeholder="http://server.com:port"
            placeholderTextColor={COLORS.PLACEHOLDER}
            value={server}
            onChangeText={setServer}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => requestFocus(usernameInputRef)}
            hasTVPreferredFocus={true}
          />
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            ref={usernameInputRef}
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor={COLORS.PLACEHOLDER}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => requestFocus(passwordInputRef)}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={COLORS.PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => requestFocus(loginButtonRef)}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          ref={loginButtonRef}
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.WHITE} size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Enter your Xtream Codes / XUI credentials
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: Platform.isTV ? 500 : '90%',
    maxWidth: 500,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: COLORS.ERROR_BACKGROUND,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: COLORS.TEXT,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default LoginScreen;
