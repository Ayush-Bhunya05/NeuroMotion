/**
 * Physical API Configuration — Smart Backend Discovery
 * 
 * Automatically discovers the backend by testing multiple addresses.
 * Falls back to last-known-good URL from AsyncStorage.
 * Can be manually configured via the Settings screen.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL_KEY = 'physical_backend_url';
const DEFAULT_PORT = 5000;

// Candidate addresses to try (in order of priority)
const CANDIDATE_URLS = [
  `http://10.0.2.2:${DEFAULT_PORT}`,      // Android emulator → host machine
  `http://localhost:${DEFAULT_PORT}`,       // iOS simulator / local dev  
  `http://127.0.0.1:${DEFAULT_PORT}`,      // Loopback
];

let _cachedUrl: string | null = null;
let _isOnline: boolean = false;

/**
 * Get the current backend URL.
 * Returns the cached/discovered URL or a fallback.
 */
export function getBackendUrl(): string {
  return _cachedUrl || `http://localhost:${DEFAULT_PORT}`;
}

export function isBackendOnline(): boolean {
  return _isOnline;
}

/**
 * Test if a backend URL is reachable by hitting /api/health.
 */
export async function testBackendUrl(url: string, timeoutMs: number = 2500): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(`${url}/api/health`, { 
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(timeout);
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Discover the backend URL by testing candidates.
 * Order: saved URL → candidate list.
 */
export async function discoverBackend(): Promise<{ url: string; online: boolean }> {
  // 1. Try the saved URL first (most likely to work)
  const savedUrl = await getSavedBackendUrl();
  if (savedUrl) {
    const ok = await testBackendUrl(savedUrl);
    if (ok) {
      _cachedUrl = savedUrl;
      _isOnline = true;
      return { url: savedUrl, online: true };
    }
  }

  // 2. Try all candidate URLs
  for (const url of CANDIDATE_URLS) {
    const ok = await testBackendUrl(url, 1500);
    if (ok) {
      _cachedUrl = url;
      _isOnline = true;
      await saveBackendUrl(url);
      return { url, online: true };
    }
  }

  // 3. None found — use saved or first candidate as fallback
  _cachedUrl = savedUrl || CANDIDATE_URLS[0];
  _isOnline = false;
  return { url: _cachedUrl, online: false };
}

/**
 * Manually set the backend URL (from Settings screen).
 */
export async function setBackendUrl(url: string): Promise<boolean> {
  // Normalize: remove trailing slash
  url = url.replace(/\/+$/, '');
  
  const ok = await testBackendUrl(url);
  if (ok) {
    _cachedUrl = url;
    _isOnline = true;
    await saveBackendUrl(url);
    return true;
  }
  
  // Save even if offline (user might start backend later)
  _cachedUrl = url;
  _isOnline = false;
  await saveBackendUrl(url);
  return false;
}

async function saveBackendUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKEND_URL_KEY, url);
  } catch {
    // Silently fail
  }
}

async function getSavedBackendUrl(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BACKEND_URL_KEY);
  } catch {
    return null;
  }
}

// Legacy export for backward compatibility
export const BACKEND_URL = `http://localhost:${DEFAULT_PORT}`;

// Frame capture settings  
export const POSE_DETECTION_INTERVAL_MS = 300;
export const IMAGE_QUALITY = 0.3;
export const IMAGE_WIDTH = 320;
