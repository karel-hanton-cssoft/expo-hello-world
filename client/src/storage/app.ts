/**
 * App-level storage helpers using AsyncStorage.
 * Manages default user profile and plans list with associated data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../models';

// Storage keys
const KEYS = {
  DEFAULT_USER: 'app:defaultUser',
  PLANS: 'app:plans',
  planAccessKey: (planId: string) => `plan:${planId}:accessKey`,
  planMeUserId: (planId: string) => `plan:${planId}:meUserId`,
};

/**
 * Get default user profile; creates default (id="defaultUser", displayName="Me") if not exists.
 */
export async function getDefaultUser(): Promise<User> {
  try {
    const json = await AsyncStorage.getItem(KEYS.DEFAULT_USER);
    if (json) {
      return JSON.parse(json);
    }
  } catch (err) {
    console.warn('Failed to read default user, creating default', err);
  }

  // Create default user
  const defaultUser: User = {
    id: 'defaultUser',
    displayName: 'Me',
  };
  await setDefaultUser(defaultUser);
  return defaultUser;
}

/**
 * Save default user profile.
 */
export async function setDefaultUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.DEFAULT_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save default user', err);
    throw err;
  }
}

/**
 * Get app settings; creates empty object if not exists.
 */
export async function getAppSettings(): Promise<Record<string, any>> {
  try {
    const json = await AsyncStorage.getItem('app:settings');
    if (json) {
      return JSON.parse(json);
    }
  } catch (err) {
    console.warn('Failed to read app settings, creating default', err);
  }
  
  // Create default empty settings
  const defaultSettings = {};
  await setAppSettings(defaultSettings);
  return defaultSettings;
}

/**
 * Save app settings.
 */
export async function setAppSettings(settings: Record<string, any>): Promise<void> {
  try {
    await AsyncStorage.setItem('app:settings', JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save app settings', err);
    throw err;
  }
}

/**
 * Get all plan IDs.
 */
export async function getPlans(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(KEYS.PLANS);
    if (json) {
      return JSON.parse(json);
    }
  } catch (err) {
    console.warn('Failed to read plans list', err);
  }
  return [];
}

/**
 * Add planId to app:plans and set accessKey/meUserId; overwrites if planId already exists.
 */
export async function addPlan(
  planId: string,
  accessKey: string,
  meUserId: string
): Promise<void> {
  try {
    // Get current plans
    const plans = await getPlans();
    
    // Add planId if not already in list
    if (!plans.includes(planId)) {
      plans.push(planId);
      await AsyncStorage.setItem(KEYS.PLANS, JSON.stringify(plans));
    }

    // Set accessKey and meUserId (overwrites if exists)
    await AsyncStorage.multiSet([
      [KEYS.planAccessKey(planId), accessKey],
      [KEYS.planMeUserId(planId), meUserId],
    ]);
  } catch (err) {
    console.error('Failed to add plan', err);
    throw err;
  }
}

/**
 * Get whole plan data (both accessKey and meUserId in one call).
 */
export async function getPlan(
  planId: string
): Promise<{ accessKey: string; meUserId: string } | null> {
  try {
    const keys = [KEYS.planAccessKey(planId), KEYS.planMeUserId(planId)];
    const values = await AsyncStorage.multiGet(keys);
    
    const accessKey = values[0][1];
    const meUserId = values[1][1];

    if (accessKey && meUserId) {
      return { accessKey, meUserId };
    }
  } catch (err) {
    console.warn('Failed to get plan data', err);
  }
  return null;
}

/**
 * Get accessKey for plan.
 */
export async function getAccessKey(planId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.planAccessKey(planId));
  } catch (err) {
    console.warn('Failed to get accessKey', err);
    return null;
  }
}

/**
 * Get "me" user id for plan.
 */
export async function getMeUserId(planId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.planMeUserId(planId));
  } catch (err) {
    console.warn('Failed to get meUserId', err);
    return null;
  }
}

/**
 * Set "me" user id for plan.
 */
export async function setMeUserId(planId: string, userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.planMeUserId(planId), userId);
  } catch (err) {
    console.error('Failed to set meUserId', err);
    throw err;
  }
}

/**
 * Delete app plan record completely (removes plan from list, accessKey and meUserId keys).
 */
export async function removePlan(planId: string): Promise<void> {
  try {
    // Remove from plans list
    const plans = await getPlans();
    const filtered = plans.filter((id) => id !== planId);
    await AsyncStorage.setItem(KEYS.PLANS, JSON.stringify(filtered));

    // Remove associated keys
    await AsyncStorage.multiRemove([
      KEYS.planAccessKey(planId),
      KEYS.planMeUserId(planId),
    ]);
  } catch (err) {
    console.error('Failed to remove plan', err);
    throw err;
  }
}

/**
 * Clear all app-level AsyncStorage (app:defaultUser, app:plans, all plan:{id}:* keys).
 * Serves only for testing/development purposes, never used in real operation.
 */
export async function clearAllAppData(): Promise<void> {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys that match app:* or plan:*:
    const appKeys = allKeys.filter(
      (key) => key.startsWith('app:') || key.startsWith('plan:')
    );

    // Remove all matching keys
    await AsyncStorage.multiRemove(appKeys);
  } catch (err) {
    console.error('Failed to clear app data', err);
    throw err;
  }
}

/**
 * Generate Access Key using crypto.randomUUID() or similar.
 * Returns string like "550e8400-e29b-41d4-a716-446655440000".
 */
export function generateAccessKey(): string {
  // React Native doesn't have crypto.randomUUID(), use fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
