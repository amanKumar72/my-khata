import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Store, AppSettings } from '../types';
import { storeRepo } from '../repositories/storeRepo';
import { getDatabase } from '../db/database';

interface AppContextType {
  theme: 'light' | 'dark';
  currency: string;
  firstLaunch: boolean;
  selectedStoreId: string;
  selectedStore: Store | null;
  stores: Store[];
  isLocked: boolean;
  hasPin: boolean;
  isLoading: boolean;
  toggleTheme: () => Promise<void>;
  changeCurrency: (currency: string) => Promise<void>;
  selectStore: (storeId: string) => Promise<void>;
  createStore: (name: string, phone?: string, address?: string) => Promise<Store>;
  updateStore: (id: string, name: string, phone?: string, address?: string) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  loadStores: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlockApp: () => void;
  lockApp: () => void;
  setFirstLaunchCompleted: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark as Luminous Ledger is a dark system
  const [currency, setCurrency] = useState('₹');
  const [firstLaunch, setFirstLaunch] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial settings and stores
  const initApp = useCallback(async () => {
    try {
      setIsLoading(true);
      // Wait for SQLite database to run migrations
      await getDatabase();

      // Read settings from AsyncStorage
      const storedTheme = await AsyncStorage.getItem('theme');
      const storedCurrency = await AsyncStorage.getItem('currency');
      const storedFirstLaunch = await AsyncStorage.getItem('firstLaunch');
      const storedStoreId = await AsyncStorage.getItem('selectedStoreId');

      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }
      if (storedCurrency) {
        setCurrency(storedCurrency);
      }
      
      const isFirst = storedFirstLaunch === null ? true : storedFirstLaunch === 'true';
      setFirstLaunch(isFirst);

      // Check if security PIN is enabled in Secure Store
      const savedPin = await SecureStore.getItemAsync('app_lock_pin');
      if (savedPin) {
        setHasPin(true);
        setIsLocked(true); // Lock app if PIN is enabled
      } else {
        setHasPin(false);
        setIsLocked(false);
      }

      // Load stores
      let dbStores = await storeRepo.getAll();
      
      // If first launch or no stores exist, seed a default store
      if (dbStores.length === 0) {
        const defaultStore = await storeRepo.create('My Business Ledger', '', 'Local Market');
        dbStores = [defaultStore];
        setSelectedStoreId(defaultStore.id);
        setSelectedStore(defaultStore);
        await AsyncStorage.setItem('selectedStoreId', defaultStore.id);
        await AsyncStorage.setItem('firstLaunch', 'false');
        setFirstLaunch(false);
      } else {
        setStores(dbStores);
        let activeId = storedStoreId || '';
        let activeStore = dbStores.find(s => s.id === activeId);
        
        if (!activeStore) {
          activeStore = dbStores[0];
          activeId = activeStore.id;
          await AsyncStorage.setItem('selectedStoreId', activeId);
        }
        setSelectedStoreId(activeId);
        setSelectedStore(activeStore);
      }
    } catch (error) {
      console.error('App context initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const loadStores = async () => {
    try {
      const dbStores = await storeRepo.getAll();
      setStores(dbStores);
      if (selectedStoreId) {
        const current = dbStores.find(s => s.id === selectedStoreId);
        if (current) {
          setSelectedStore(current);
        } else if (dbStores.length > 0) {
          setSelectedStoreId(dbStores[0].id);
          setSelectedStore(dbStores[0]);
          await AsyncStorage.setItem('selectedStoreId', dbStores[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load stores:', e);
    }
  };

  const selectStore = async (storeId: string) => {
    try {
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setSelectedStoreId(storeId);
        setSelectedStore(store);
        await AsyncStorage.setItem('selectedStoreId', storeId);
      }
    } catch (e) {
      console.error('Failed to select store:', e);
    }
  };

  const createStore = async (name: string, phone?: string, address?: string): Promise<Store> => {
    const store = await storeRepo.create(name, phone, address);
    await loadStores();
    await selectStore(store.id);
    return store;
  };

  const updateStore = async (id: string, name: string, phone?: string, address?: string) => {
    await storeRepo.update(id, name, phone, address);
    await loadStores();
  };

  const deleteStore = async (id: string) => {
    await storeRepo.delete(id);
    const updatedStores = stores.filter(s => s.id !== id);
    if (updatedStores.length === 0) {
      // Seed a default one if all stores deleted
      await storeRepo.create('My Business Ledger', '', 'Local Market');
    }
    await loadStores();
  };

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    await AsyncStorage.setItem('theme', nextTheme);
  };

  const changeCurrency = async (sym: string) => {
    setCurrency(sym);
    await AsyncStorage.setItem('currency', sym);
  };

  const setFirstLaunchCompleted = async () => {
    setFirstLaunch(false);
    await AsyncStorage.setItem('firstLaunch', 'false');
  };

  // Secure PIN operations
  const setPin = async (pin: string) => {
    await SecureStore.setItemAsync('app_lock_pin', pin);
    setHasPin(true);
    setIsLocked(false);
  };

  const disablePin = async () => {
    await SecureStore.deleteItemAsync('app_lock_pin');
    setHasPin(false);
    setIsLocked(false);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const savedPin = await SecureStore.getItemAsync('app_lock_pin');
    return savedPin === pin;
  };

  const unlockApp = () => setIsLocked(false);
  const lockApp = () => {
    if (hasPin) {
      setIsLocked(true);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        currency,
        firstLaunch,
        selectedStoreId,
        selectedStore,
        stores,
        isLocked,
        hasPin,
        isLoading,
        toggleTheme,
        changeCurrency,
        selectStore,
        createStore,
        updateStore,
        deleteStore,
        loadStores,
        setPin,
        disablePin,
        verifyPin,
        unlockApp,
        lockApp,
        setFirstLaunchCompleted,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
