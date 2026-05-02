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
// Sync blocked numbers to UserDefaults so the CallKit extension can read them
async function syncToExtension(contacts: BlockedContact[]) {
  if (Platform.OS !== 'ios') return;
  try {
    const numbers = contacts
      .filter((c) => c.isActive)
      .flatMap((c) => c.phoneNumbers);
    const SharedGroupPreferences = require('react-native-shared-group-preferences').default;
    // Use standard UserDefaults (no App Groups needed)
    await SharedGroupPreferences.setItem('callshield_blocked', numbers, null);
  } catch {
    // Best-effort sync
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
    await syncToExtension(contacts);
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
