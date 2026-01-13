// @ts-nocheck
/*
 * Copyright 2024-2025 Amazon.com, Inc. or its affiliates. All rights reserved.
 *
 * AMAZON PROPRIETARY/CONFIDENTIAL
 *
 * You may not use this file except in compliance with the terms and
 * conditions set forth in the accompanying LICENSE.TXT file.
 *
 * THESE MATERIALS ARE PROVIDED ON AN "AS IS" BASIS. AMAZON SPECIFICALLY
 * DISCLAIMS, WITH RESPECT TO THESE MATERIALS, ALL WARRANTIES, EXPRESS,
 * IMPLIED, OR STATUTORY, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
 */

/**
 * W3C Media polyfill for Vega platform
 */
export default class W3CMediaPolyfill {
  static install() {
    // Polyfills for W3C Media APIs
    if (typeof global.MediaSource === 'undefined') {
      // MediaSource is provided by react-native-w3cmedia
      // This is a placeholder to prevent errors
      console.log('W3CMediaPolyfill: MediaSource will be provided by platform');
    }
    
    if (typeof global.navigator === 'undefined') {
      global.navigator = {
        userAgent: 'VegaOS/1.0',
        platform: 'VegaOS',
        language: 'en-US',
        languages: ['en-US', 'en'],
        onLine: true,
      };
    }
    
    if (!global.navigator.requestMediaKeySystemAccess) {
      // This should be provided by the platform
      console.log('W3CMediaPolyfill: EME APIs should be provided by platform');
    }
  }
}
