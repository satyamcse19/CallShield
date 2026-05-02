import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlockedContactCard from '../components/BlockedContactCard';
import EmptyState from '../components/EmptyState';
import { Colors } from '../constants/colors';
import { SimSelection, useBlockedContacts } from '../store/useBlockedContacts';

export default function HomeScreen() {
  const router = useRouter();
  const { blockedContacts, loading, removeContact, toggleContact, updateSimSelection } =
    useBlockedContacts();

  const activeCount = blockedContacts.filter((c) => c.isActive).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Stats Banner */}
      {blockedContacts.length > 0 && (
        <View style={styles.banner}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerNum}>{blockedContacts.length}</Text>
            <Text style={styles.bannerLabel}>Blocked</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={[styles.bannerNum, { color: Colors.success }]}>{activeCount}</Text>
            <Text style={styles.bannerLabel}>Active</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={[styles.bannerNum, { color: Colors.warning }]}>
              {blockedContacts.length - activeCount}
            </Text>
            <Text style={styles.bannerLabel}>Paused</Text>
          </View>
        </View>
      )}

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔕</Text>
        <Text style={styles.infoText}>
          Selected contacts will be sent directly to voicemail — regardless of phone mode.
        </Text>
      </View>

      {/* List */}
      {!loading && (
        <FlatList
          data={blockedContacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            blockedContacts.length === 0 && styles.listEmpty,
          ]}
          renderItem={({ item }) => (
            <BlockedContactCard
              contact={item}
              onRemove={removeContact}
              onToggle={toggleContact}
              onSimChange={(id: string, sim: SimSelection) => updateSimSelection(id, sim)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="🛡️"
              title="No contacts blocked"
              subtitle="Tap the + button to add contacts whose calls should go straight to voicemail."
            />
          }
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => router.push('/add-contact')}>
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

      {/* Settings button */}
      <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings')}>
        <Text style={styles.settingsIcon}>⚙️</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerStat: {
    flex: 1,
    alignItems: 'center',
  },
  bannerNum: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
  bannerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  bannerDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '22',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 10,
    gap: 8,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: {
    color: Colors.white,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
  settingsBtn: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  settingsIcon: {
    fontSize: 22,
  },
});
