import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

export type SimSelection = 'ALL' | 'SIM1' | 'SIM2';

export interface BlockedContact {
  id: string;
  name: string;
  phoneNumbers: string[];
  simSelection: SimSelection;
  addedAt: number;
  isActive: boolean;
}

const STORAGE_KEY = '@callshield_blocked_contacts';
const APP_GROUP = 'group.callshield.blocked';
const NUMBERS_KEY = 'blocked_numbers';

// Lazily load SharedGroupPreferences only on iOS (native module not available on web/Android)
async function syncToAppGroup(contacts: BlockedContact[]) {
  if (Platform.OS !== 'ios') return;
  try {
    // Only include active contacts; gather all phone numbers
    const numbers = contacts
      .filter((c) => c.isActive)
      .flatMap((c) => c.phoneNumbers);

    // react-native-shared-group-preferences
    const SharedGroupPreferences = require('react-native-shared-group-preferences').default;
    await SharedGroupPreferences.setItem(NUMBERS_KEY, numbers, APP_GROUP);
  } catch {
    // Extension sync is best-effort
  }
}

export function useBlockedContacts() {
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setBlockedContacts(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback(async (contacts: BlockedContact[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    setBlockedContacts(contacts);
    await syncToAppGroup(contacts);
  }, []);

  const addContact = useCallback(
    async (contact: Omit<BlockedContact, 'addedAt' | 'isActive'>) => {
      const updated = [...blockedContacts, { ...contact, addedAt: Date.now(), isActive: true }];
      await persist(updated);
    },
    [blockedContacts, persist]
  );

  const removeContact = useCallback(
    async (id: string) => {
      await persist(blockedContacts.filter((c) => c.id !== id));
    },
    [blockedContacts, persist]
  );

  const toggleContact = useCallback(
    async (id: string) => {
      await persist(blockedContacts.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)));
    },
    [blockedContacts, persist]
  );

  const updateSimSelection = useCallback(
    async (id: string, simSelection: SimSelection) => {
      await persist(blockedContacts.map((c) => (c.id === id ? { ...c, simSelection } : c)));
    },
    [blockedContacts, persist]
  );

  const isAlreadyBlocked = useCallback(
    (contactId: string) => blockedContacts.some((c) => c.id === contactId),
    [blockedContacts]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    blockedContacts,
    loading,
    addContact,
    removeContact,
    toggleContact,
    updateSimSelection,
    isAlreadyBlocked,
  };
}
