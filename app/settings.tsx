import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useBlockedContacts } from '../store/useBlockedContacts';

export default function SettingsScreen() {
  const { blockedContacts } = useBlockedContacts();

  const clearAll = () => {
    Alert.alert(
      'Clear All',
      'This will remove all blocked contacts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@callshield_blocked_contacts');
            Alert.alert('Done', 'All blocked contacts have been removed. Please restart the app.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How CallShield Works</Text>
        <View style={styles.card}>
          <Row icon="🔔" text="Spam contacts ring but show 'Spam - CallShield' label on screen." />
          <Divider />
          <Row icon="📬" text="Don't pick up — call goes to voicemail automatically after timeout." />
          <Divider />
          <Row icon="📱" text="Works on both SIM 1 and SIM 2 (dual eSIM supported)." />
          <Divider />
          <Row icon="⏸️" text="You can pause spam filtering for any contact using the toggle." />
        </View>

        {/* SIM Info */}
        <Text style={styles.sectionTitle}>SIM Selection Guide</Text>
        <View style={styles.card}>
          <SimRow color={Colors.simAll} label="All SIMs" desc="Spam label shows on both SIM 1 and SIM 2 calls." />
          <Divider />
          <SimRow color={Colors.sim1} label="SIM 1" desc="Spam filter on SIM 1 only. SIM 2 calls come through normally." />
          <Divider />
          <SimRow color={Colors.sim2} label="SIM 2" desc="Spam filter on SIM 2 only. SIM 1 calls come through normally." />
        </View>

        {/* iOS Notice */}
        <Text style={styles.sectionTitle}>iOS Important Note</Text>
        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Enable{' '}
            <Text style={styles.bold}>Settings {'>'} Phone {'>'} Call Blocking & Identification</Text>{' '}
            and turn on <Text style={styles.bold}>CallShield</Text>. Without this, spam labels will not show on incoming calls.
          </Text>
          <Text style={[styles.warningText, { marginTop: 8 }]}>
            When a spam number calls, your phone rings with the label "Spam - CallShield". Simply don't answer — it will go to voicemail after ~20 seconds.
          </Text>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.card}>
          <Row icon="🔖" text={`${blockedContacts.length} contact${blockedContacts.length !== 1 ? 's' : ''} marked as spam`} />
          <Divider />
          <Row
            icon="✅"
            text={`${blockedContacts.filter((c) => c.isActive).length} currently active`}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Pressable style={styles.dangerBtn} onPress={clearAll}>
          <Text style={styles.dangerBtnText}>🗑️  Clear All Spam Contacts</Text>
        </Pressable>

        <Text style={styles.footer}>CallShield v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

function SimRow({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.simDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.simRowLabel, { color }]}>{label}</Text>
        <Text style={styles.simRowDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  warningCard: {
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 10,
  },
  rowIcon: { fontSize: 18, lineHeight: 22 },
  rowText: { flex: 1, fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.border },
  simDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 4,
  },
  simRowLabel: { fontSize: 13, fontWeight: '700' },
  simRowDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  warningIcon: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
  warningText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  bold: { fontWeight: '700' },
  dangerBtn: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  dangerBtnText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },
  footer: {
    textAlign: 'center',
    color: Colors.textLight,
    fontSize: 12,
    marginTop: 32,
  },
});
