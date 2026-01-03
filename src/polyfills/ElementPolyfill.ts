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
 * Element polyfill for Vega platform
 */
export default class Element {
  static install() {
    if (typeof global.Element === 'undefined') {
      global.Element = class {
        constructor() {
          this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false,
          };
          this.style = {};
          this.attributes = {};
        }
        
        setAttribute(name: string, value: any) {
          this.attributes[name] = value;
        }
        
        getAttribute(name: string) {
          return this.attributes[name];
        }
        
        appendChild() {}
        removeChild() {}
      };
    }
  }
}
