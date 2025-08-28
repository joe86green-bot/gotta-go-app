import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { ScheduledItem } from '@/constants/recordings';

const STORAGE_KEY = 'scheduled_items';

export const [ScheduledItemsProvider, useScheduledItems] = createContextHook(() => {
  const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScheduledItems = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored).map((item: any) => ({
          ...item,
          scheduledTime: new Date(item.scheduledTime),
        }));
        setScheduledItems(items);
      }
    } catch (error) {
      console.error('Error loading scheduled items:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheduledItems();
  }, [loadScheduledItems]);

  const saveScheduledItems = useCallback(async (items: ScheduledItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving scheduled items:', error);
    }
  }, []);

  const addScheduledItem = useCallback((item: Omit<ScheduledItem, 'id' | 'status'>) => {
    // Check if we already have 3 scheduled items
    if (scheduledItems.length >= 3) {
      throw new Error('Maximum of 3 scheduled items allowed at a time');
    }
    
    const newItem: ScheduledItem = {
      ...item,
      id: Date.now().toString(),
      status: 'pending',
    };
    const updatedItems = [...scheduledItems, newItem];
    setScheduledItems(updatedItems);
    saveScheduledItems(updatedItems);
    return newItem.id;
  }, [scheduledItems, saveScheduledItems]);

  const removeScheduledItem = useCallback((id: string) => {
    const updatedItems = scheduledItems.filter(item => item.id !== id);
    setScheduledItems(updatedItems);
    saveScheduledItems(updatedItems);
  }, [scheduledItems, saveScheduledItems]);

  const updateScheduledItem = useCallback((id: string, updates: Partial<ScheduledItem>) => {
    const updatedItems = scheduledItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setScheduledItems(updatedItems);
    saveScheduledItems(updatedItems);
  }, [scheduledItems, saveScheduledItems]);

  const clearAllScheduledItems = useCallback(() => {
    setScheduledItems([]);
    saveScheduledItems([]);
  }, [saveScheduledItems]);

  // Auto-remove completed items
  useEffect(() => {
    const checkAndRemoveCompleted = () => {
      const now = new Date();
      const itemsToRemove = scheduledItems.filter(item => {
        const scheduledTime = new Date(item.scheduledTime);
        // Remove items that are 5 minutes past their scheduled time
        return now.getTime() - scheduledTime.getTime() > 5 * 60 * 1000;
      });

      if (itemsToRemove.length > 0) {
        const updatedItems = scheduledItems.filter(item => {
          const scheduledTime = new Date(item.scheduledTime);
          return now.getTime() - scheduledTime.getTime() <= 5 * 60 * 1000;
        });
        setScheduledItems(updatedItems);
        saveScheduledItems(updatedItems);
        console.log(`Auto-removed ${itemsToRemove.length} completed items`);
      }
    };

    const interval = setInterval(checkAndRemoveCompleted, 60000); // Check every minute
    checkAndRemoveCompleted(); // Check immediately

    return () => clearInterval(interval);
  }, [scheduledItems, saveScheduledItems]);

  return useMemo(() => ({
    scheduledItems,
    isLoading,
    addScheduledItem,
    removeScheduledItem,
    updateScheduledItem,
    clearAllScheduledItems,
  }), [scheduledItems, isLoading, addScheduledItem, removeScheduledItem, updateScheduledItem, clearAllScheduledItems]);
});