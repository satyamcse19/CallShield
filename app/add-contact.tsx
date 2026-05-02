import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../components/EmptyState';
import SimSelector from '../components/SimSelector';
import { Colors } from '../constants/colors';
import { SimSelection, useBlockedContacts } from '../store/useBlockedContacts';

interface ContactItem {
  id: string;
  name: string;
  phoneNumbers: string[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AddContactScreen() {
  const router = useRouter();
  const { addContact, isAlreadyBlocked } = useBlockedContacts();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [filtered, setFiltered] = useState<ContactItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Per-contact pending SIM selection before adding
  const [selectedSim, setSelectedSim] = useState<Record<string, SimSelection>>({});

  const loadContacts = useCallback(async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    const items: ContactItem[] = data
      .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
      .map((c) => ({
        id: c.id ?? Math.random().toString(),
        name: c.name!,
        phoneNumbers: c.phoneNumbers!.map((p) => p.number ?? '').filter(Boolean),
      }));

    setContacts(items);
    setFiltered(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    setFiltered(
      q === ''
        ? contacts
        : contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.phoneNumbers.some((p) => p.includes(q))
          )
    );
  }, [search, contacts]);

  const handleAdd = useCallback(
    async (contact: ContactItem) => {
      await addContact({
        id: contact.id,
        name: contact.name,
        phoneNumbers: contact.phoneNumbers,
        simSelection: selectedSim[contact.id] ?? 'ALL',
      });
      router.back();
    },
    [addContact, selectedSim, router]
  );

  const toggleSim = useCallback((id: string, sim: SimSelection) => {
    setSelectedSim((prev) => ({ ...prev, [id]: sim }));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <EmptyState
          icon="🔒"
          title="Contacts Permission Denied"
          subtitle="Please go to Settings > Privacy > Contacts and allow CallShield to access your contacts."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="👤"
            title="No contacts found"
            subtitle={
              search
                ? `No results for "${search}"`
                : 'No contacts with phone numbers found.'
            }
          />
        }
        renderItem={({ item }) => {
          const blocked = isAlreadyBlocked(item.id);
          const sim = selectedSim[item.id] ?? 'ALL';

          return (
            <View style={[styles.contactCard, blocked && styles.contactBlocked]}>
              <View style={styles.contactTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  <Text style={styles.contactNumber} numberOfLines={1}>
                    {item.phoneNumbers.join(' · ')}
                  </Text>
                </View>
                <Pressable
                  style={[styles.addBtn, blocked && styles.addBtnBlocked]}
                  disabled={blocked}
                  onPress={() => handleAdd(item)}
                >
                  <Text style={[styles.addBtnText, blocked && styles.addBtnTextBlocked]}>
                    {blocked ? 'Added ✓' : 'Block'}
                  </Text>
                </Pressable>
              </View>

              {!blocked && (
                <View style={styles.simWrap}>
                  <Text style={styles.simLabel}>Block on:</Text>
                  <SimSelector value={sim} onChange={(s) => toggleSim(item.id, s)} compact />
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  listEmpty: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactBlocked: {
    opacity: 0.5,
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  contactNumber: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.danger,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addBtnBlocked: {
    backgroundColor: Colors.success + '22',
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  addBtnTextBlocked: {
    color: Colors.success,
  },
  simWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  simLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
