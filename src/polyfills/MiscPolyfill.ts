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
 * Miscellaneous polyfills for Vega platform
 */
export default class MiscPolyfill {
  static install() {
    // window polyfill
    if (typeof global.window === 'undefined') {
      global.window = global;
    }
    
    // URL polyfill
    if (typeof global.URL === 'undefined') {
      global.URL = class {
        constructor(url: string, base?: string) {
          this.href = url;
        }
        
        static createObjectURL() {
          return 'blob:vega';
        }
        
        static revokeObjectURL() {}
      };
    }
    
    // performance polyfill
    if (typeof global.performance === 'undefined') {
      global.performance = {
        now: () => Date.now(),
      };
    }
    
    // console polyfill (ensure all methods exist)
    if (typeof console !== 'undefined') {
      ['log', 'warn', 'error', 'info', 'debug'].forEach((method) => {
        if (typeof console[method] !== 'function') {
          console[method] = () => {};
        }
      });
    }
  }
}
