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
// @ts-nocheck
import * as HlsPlayerLib from './dist/hls.mjs'
import { HTMLMediaElement } from "@amazon-devices/react-native-w3cmedia/dist/headless";
import { PlayerInterface } from '../PlayerInterface.js';

// import polyfills
import Document from '../polyfills/DocumentPolyfill';
import Element from '../polyfills/ElementPolyfill';
import TextDecoderPolyfill from '../polyfills/TextDecoderPolyfill';
import W3CMediaPolyfill from '../polyfills/W3CMediaPolyfill';
import MiscPolyfill from '../polyfills/MiscPolyfill';

const SEEKTIME = 10;
const playerName: string = "hlsjs";
const playerVersion: string = "1.5.11";

// install polyfills
Document.install();
Element.install();
TextDecoderPolyfill.install();
W3CMediaPolyfill.install();
MiscPolyfill.install();


export class HlsJsPlayer implements PlayerInterface {
  private playbackItem: {} = {};
  private mediaElement: HTMLMediaElement;
  player: Hls.Player;
  static readonly enableNativeParsing = false;
  constructor(mediaElement: HTMLMediaElement) {
    this.mediaElement = mediaElement;
  }

  createPlayerInstance = () => {
    let signal_secure: string = 'HW_SECURE_ALL';
    let audio_not_secure: string = 'SW_SECURE_CRYPTO';
    if (this.playbackItem.drm_scheme === 'com.microsoft.playready') {
      signal_secure = '150';
    }
    console.log(`hlsplayer: loading with ${this.playbackItem.drm_scheme} and ${this.playbackItem.drm_license_uri} and ${this.playbackItem.secure}`);
    if (this.playbackItem.secure === "true") {
      if (this.playbackItem.drm_scheme === 'com.microsoft.playready') {
        signal_secure = '3000';
      } else {
        signal_secure = 'HW_SECURE_ALL';
      }
    }
    this.hls = new HlsPlayerLib.Hls({
      enableWorker: true,
      emeEnabled: true,
      lowLatencyMode: false,
      progressive: false,
      debug: true,
      backBufferLength: 30,
      maxBufferLength: 10,
      maxMaxBufferLength: 30,
      subtitleStreamController: undefined,
      subtitleTrackController: undefined,
      timelineController: undefined,
      drmSystems: {
        [this.playbackItem.drm_scheme]: {
          licenseUrl: this.playbackItem.drm_license_uri,
        },
      },
      drmSystemOptions: {
        audioRobustness: audio_not_secure,
        videoRobustness: signal_secure,
      },
      requestMediaKeySystemAccessFunc: (keySystem, supportedConfigurations) => {
        console.log(`HLSJSPLAYER supportedConfigurations = ${JSON.stringify(supportedConfigurations)}`)
        return window.navigator.requestMediaKeySystemAccess(keySystem, supportedConfigurations);
      }
    });
    console.log('Create instance in Hls player');
  };

  nativeParseLevelPlaylist( manifest: string,
      absoluteuri:string,
      id: number,
      type: HlsPlayerLib.PlaylistLevelType
    ) : HlsPlayerLib.LevelDetails {
    console.log('HlsJs: nativeParseLevelPlaylist +');
    let levels: HlsPlayerLib.LevelDetails = global.parseHlsManifest(
      playerName, playerVersion, absoluteuri, manifest, id, type, HlsPlayerLib);
    console.log(`HlsJs: nativeParseLevelPlaylist -`);
    return levels;
  }

  load = (content: any, _autoplay: boolean) => {
    console.log("Hlsjs: Load +");
    if (HlsJsPlayer.enableNativeParsing) {
      if (global.registerNativePlayerUtils &&
        HlsPlayerLib.M3U8Parser.setNativeFunctions) {
        console.log("Hlsjs: registerNativePlayerUtils found");
        if (!global.isNativeHlsParserSupported) {
          const ret = global.registerNativePlayerUtils();
          console.log("Hlsjs: native functions registered: " + ret);
        }
        if (global.isNativeHlsParserSupported &&
            global.parseHlsManifest) {
          const nativeHlsParserSupported =
              global.isNativeHlsParserSupported(playerName, playerVersion);
          if (nativeHlsParserSupported) {
            console.log('Hlsjs: setting native functions');
            HlsPlayerLib.M3U8Parser.setNativeFunctions(this.nativeParseLevelPlaylist);
          } else {
            console.log('hlsjs: nativeHlsParser not supported for player version');
          }
        } else {
          console.log('hlsjs: native func not set even after register, skipping it');
        }
      } else {
        console.log(`hlsjs: native offload not enabled!
            registerNativePlayerUtils: ${!!global.registerNativePlayerUtils},
            setNativeFunctions: ${!!HlsPlayerLib.M3U8Parser.setNativeFunctions}`);
      }
    } else {
      console.log(`hlsjs: native playlist parsing is disabled`);
    }

    this.playbackItem = content;

    this.createPlayerInstance();

    console.log('Loading the hls player with content URL:', content.uri);
    this.hls.loadSource(content.uri);

    this.hls.attachMedia(this.mediaElement);

  };

  async unload() {
    console.log('Destroying the Hls player')
  }

  play(): void {
    this.mediaElement?.play();
  }
  pause(): void {
    console.log('pause event in Hls');
    this.mediaElement?.pause();
  }
  seekFront(): void {
    const time = this.mediaElement?.time();
    if (time) {
      console.log("Hlsplayer: seekFront to ", time + SEEKTIME);
      this.mediaElement.seek(time + 10);
    }
  }
  seekBack(): void {
    const time = this.player?.time();
    if (time) {
      console.log("Hlsplayer: seekBack to ", time - SEEKTIME);
      this.mediaElement.seek(time - SEEKTIME);
    }
  }
  playbackRate(playbackrate: number): void {
    const playbackrate_ = this.mediaElement.getPlaybackRate();
    console.log("Hlsplayer: set playbackRate from  " + playbackrate_ + "to" + playbackrate);
    this.mediaElement.setPlaybackRate(playbackrate);
  }
  volume(volumelevel: number): void {
    const volumeLevel_ = this.mediaElement.getVolume();
    console.log("Hlsplayer: set volume level from  " + volumeLevel_ + "to" + volumelevel);
    this.mediaElement.setVolume(volumelevel);

  }
  mute(mute: boolean): void {
    const muted_ = this.player.isMuted();
    console.log("Hlsplayer: set mute from  " + muted_ + "to" + mute);
    this.player.setMute(mute);
  };
  getAudioLanguages(): string[] {
    return [];
  };
  selectAudioLanguage(language: string): void {
    this.player.selectAudioLanguage(language);
  }
}