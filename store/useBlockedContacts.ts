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
const GIST_ID = process.env.EXPO_PUBLIC_GIST_ID ?? '';
const GIST_TOKEN = process.env.EXPO_PUBLIC_GIST_TOKEN ?? '';

async function syncToExtension(contacts: BlockedContact[]) {
  if (Platform.OS !== 'ios') return;

  const numbers = contacts
    .filter((c) => c.isActive)
    .flatMap((c) => c.phoneNumbers);

  try {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${GIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'gistfile1.txt': {
            content: JSON.stringify({ blocked_numbers: numbers }),
          },
        },
      }),
    });

    if (!res.ok) {
      console.error('[CallShield] Gist update failed:', res.status);
      return;
    }

    console.log('[CallShield] Gist updated:', numbers.length, 'numbers');

    const { NativeModules } = require('react-native');
    if (NativeModules.CallDirectoryReloader) {
      await NativeModules.CallDirectoryReloader.reload();
      console.log('[CallShield] Extension reloaded');
    }
  } catch (e) {
    console.error('[CallShield] Sync failed:', e);
  }
}

export function useBlockedContacts() {
  const [blockedContacts, setBlockedContacts] = useState<BlockedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const contacts: BlockedContact[] = JSON.parse(raw);
        setBlockedContacts(contacts);
        // Sync on startup so extension is always up to date
        await syncToExtension(contacts);
      }
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
