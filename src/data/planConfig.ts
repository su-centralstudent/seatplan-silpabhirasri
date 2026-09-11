/**
 * Central Configuration for Seating Plan Background Image & GitHub Synchronization
 * 
 * Allows seating plan background image to be set as default and automatically 
 * synchronized when modified via the GitHub repository (e.g. public/plan_config.json or assets).
 */

import { convertGoogleDriveUrl } from './googleSheetConfig';

export interface PlanSyncConfig {
  version: string;
  planImageUrl: string;
  planDriveUrl: string;
  googleSheetUrl?: string;
  opacity?: number;
  description?: string;
  lastUpdated?: string;
}

/**
 * Resolves a local asset URL taking into account Vite BASE_URL (crucial for GitHub Pages sub-paths)
 */
export function resolveAssetUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  // Clean base URL (supporting GitHub Pages sub-paths via Vite)
  const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } })?.env;
  const base = metaEnv?.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${cleanBase}${cleanPath}`;
}

export const DEFAULT_PLAN_CONFIG: PlanSyncConfig = {
  version: '1.0',
  planImageUrl: '/assets/ceremony_flow_100.svg',
  planDriveUrl: '',
  googleSheetUrl: '',
  opacity: 0.95,
  description: 'Official ceremony flow diagram for Silpa Bhirasri Day',
  lastUpdated: '2026-09-11',
};

export const GITHUB_CONFIG_APPLIED_VERSION_KEY = 'silpa_bhirasri_github_config_version';
export const GITHUB_CONFIG_LAST_IMAGE_KEY = 'silpa_bhirasri_github_last_image';
export const DEFAULT_PLAN_STORAGE_KEY = 'silpa_bhirasri_plan_default_url';
export const DEFAULT_PLAN_IMAGE_KEY = 'silpa_bhirasri_plan_default_image';

/**
 * Sets the given plan URL as the persistent default across the app
 */
export function setDefaultPlanUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = url.trim();
  if (trimmed) {
    localStorage.setItem(DEFAULT_PLAN_STORAGE_KEY, trimmed);
    localStorage.setItem('silpa_bhirasri_plan_default_drive_url', trimmed);
    const direct = convertGoogleDriveUrl(trimmed);
    localStorage.setItem(DEFAULT_PLAN_IMAGE_KEY, direct);
    localStorage.setItem('silpa_bhirasri_plan_drive_url', trimmed);
    localStorage.setItem('silpa_bhirasri_plan_bg_drive_url', trimmed);
    localStorage.setItem('silpa_bhirasri_plan_bg_image', direct);
    localStorage.setItem('silpa_bhirasri_plan_show_bg_image', 'true');
  } else {
    localStorage.removeItem(DEFAULT_PLAN_STORAGE_KEY);
    localStorage.removeItem('silpa_bhirasri_plan_default_drive_url');
    localStorage.removeItem(DEFAULT_PLAN_IMAGE_KEY);
  }
}

/**
 * Gets the configured default Google Drive / direct link
 */
export function getDefaultPlanDriveUrl(): string {
  if (typeof window !== 'undefined') {
    const savedDefaultDrive = localStorage.getItem(DEFAULT_PLAN_STORAGE_KEY) ||
      localStorage.getItem('silpa_bhirasri_plan_default_drive_url') ||
      localStorage.getItem('silpa_bhirasri_plan_drive_url') ||
      localStorage.getItem('silpa_bhirasri_plan_bg_drive_url');
    if (savedDefaultDrive && savedDefaultDrive.trim()) {
      return savedDefaultDrive.trim();
    }
  }
  return DEFAULT_PLAN_CONFIG.planDriveUrl || '';
}

/**
 * Gets the system default plan image (resolved for GitHub Pages, Google Drive, or local)
 */
export function getDefaultPlanImageUrl(): string {
  if (typeof window !== 'undefined') {
    const savedDefaultDrive = localStorage.getItem(DEFAULT_PLAN_STORAGE_KEY) ||
      localStorage.getItem('silpa_bhirasri_plan_default_drive_url') ||
      localStorage.getItem('silpa_bhirasri_plan_drive_url') ||
      localStorage.getItem('silpa_bhirasri_plan_bg_drive_url');
    if (savedDefaultDrive && savedDefaultDrive.trim()) {
      return convertGoogleDriveUrl(savedDefaultDrive.trim());
    }

    const savedDefaultImage = localStorage.getItem(DEFAULT_PLAN_IMAGE_KEY) ||
      localStorage.getItem('silpa_bhirasri_plan_bg_image');
    if (savedDefaultImage && savedDefaultImage.trim() && !savedDefaultImage.includes('ceremony_flow_100.svg')) {
      return savedDefaultImage.trim();
    }
  }

  if (DEFAULT_PLAN_CONFIG.planDriveUrl && DEFAULT_PLAN_CONFIG.planDriveUrl.trim()) {
    return convertGoogleDriveUrl(DEFAULT_PLAN_CONFIG.planDriveUrl.trim());
  }

  return resolveAssetUrl(DEFAULT_PLAN_CONFIG.planImageUrl);
}

/**
 * Fetches the latest plan configuration from the repository (public/plan_config.json)
 * with cache-busting timestamp so that changes committed to GitHub are detected immediately.
 */
export async function fetchGitHubPlanConfig(): Promise<PlanSyncConfig | null> {
  try {
    const configUrl = `${resolveAssetUrl('/plan_config.json')}?_t=${Date.now()}`;
    const res = await fetch(configUrl, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && (data.planImageUrl || data.planDriveUrl)) {
      return {
        version: String(data.version || '1.0'),
        planImageUrl: data.planImageUrl || '',
        planDriveUrl: data.planDriveUrl || '',
        googleSheetUrl: data.googleSheetUrl || '',
        opacity: typeof data.opacity === 'number' ? data.opacity : 0.95,
        description: data.description || '',
        lastUpdated: data.lastUpdated || '',
      };
    }
  } catch (err) {
    // Network or static fetch error (e.g. offline) - silently fallback
    console.warn('Could not fetch GitHub plan_config.json:', err);
  }
  return null;
}

/**
 * Determines the active plan image URL, checking:
 * 1. Saved localStorage if set
 * 2. Saved Google Drive URL
 * 3. Default plan image from GitHub repository
 */
export function getActivePlanImageUrl(savedLocalImage?: string | null, savedDriveUrl?: string | null): string {
  if (savedLocalImage && savedLocalImage.trim()) {
    return savedLocalImage.trim();
  }
  if (savedDriveUrl && savedDriveUrl.trim()) {
    return convertGoogleDriveUrl(savedDriveUrl.trim());
  }
  return getDefaultPlanImageUrl();
}

/**
 * Checks whether the fetched GitHub plan configuration has an update compared to the last applied one.
 */
export function hasGitHubConfigChanged(newConfig: PlanSyncConfig): boolean {
  try {
    const lastVersion = localStorage.getItem(GITHUB_CONFIG_APPLIED_VERSION_KEY);
    const lastImage = localStorage.getItem(GITHUB_CONFIG_LAST_IMAGE_KEY);

    // If version changed on GitHub, it's an update
    if (lastVersion && lastVersion !== newConfig.version) {
      return true;
    }

    const targetImage = newConfig.planDriveUrl
      ? convertGoogleDriveUrl(newConfig.planDriveUrl)
      : resolveAssetUrl(newConfig.planImageUrl);

    // If the image specified on GitHub changed
    if (lastImage && lastImage !== targetImage) {
      return true;
    }

    // If never applied before, apply now
    if (!lastVersion && !lastImage) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Marks a GitHub configuration as applied locally
 */
export function markGitHubConfigApplied(config: PlanSyncConfig): void {
  try {
    localStorage.setItem(GITHUB_CONFIG_APPLIED_VERSION_KEY, config.version);
    const targetImage = config.planDriveUrl
      ? convertGoogleDriveUrl(config.planDriveUrl)
      : resolveAssetUrl(config.planImageUrl);
    localStorage.setItem(GITHUB_CONFIG_LAST_IMAGE_KEY, targetImage);
  } catch {
    // ignore
  }
}

/**
 * Generates JSON string for plan_config.json so the user can easily copy or commit to GitHub
 */
export function generatePlanConfigFileContent(
  planImageUrl: string,
  planDriveUrl: string,
  googleSheetUrl?: string,
  version: string = '1.1'
): string {
  const config: PlanSyncConfig = {
    version,
    planImageUrl,
    planDriveUrl,
    googleSheetUrl: googleSheetUrl || '',
    opacity: 0.95,
    description: 'Seating plan configuration synced with GitHub repository. Update this file on GitHub to automatically update the seating plan image for all users.',
    lastUpdated: new Date().toISOString().split('T')[0],
  };
  return JSON.stringify(config, null, 2);
}
