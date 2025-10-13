import { useEffect, useState, useMemo, useCallback } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminSettings {
  schedulingDisabled: boolean;
  disabledMessage: string;
}

interface AdminContextType {
  isAdmin: boolean;
  settings: AdminSettings;
  updateSettings: (settings: Partial<AdminSettings>) => Promise<void>;
  loading: boolean;
}

const ADMIN_EMAIL = 'kevinspot@gmail.com';
const ADMIN_SETTINGS_KEY = 'admin_settings';

const DEFAULT_SETTINGS: AdminSettings = {
  schedulingDisabled: false,
  disabledMessage: 'Scheduling is temporarily disabled for maintenance. Please try again later.',
};

export const [AdminProvider, useAdmin] = createContextHook<AdminContextType>(() => {
  const [isAdmin] = useState<boolean>(false);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(ADMIN_SETTINGS_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AdminSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      await AsyncStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(updated));
      console.log('Admin settings updated:', updated);
    } catch (error) {
      console.error('Error updating admin settings:', error);
      throw error;
    }
  }, [settings]);

  return useMemo(() => ({
    isAdmin,
    settings,
    updateSettings,
    loading,
  }), [isAdmin, settings, updateSettings, loading]);
});

export const checkIsAdmin = (email: string | null | undefined): boolean => {
  return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};
