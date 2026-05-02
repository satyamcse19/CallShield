import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlockedContact, SimSelection } from '../store/useBlockedContacts';
import { Colors } from '../constants/colors';
import SimSelector from './SimSelector';

interface Props {
  contact: BlockedContact;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onSimChange: (id: string, sim: SimSelection) => void;
}

const simColors: Record<SimSelection, string> = {
  ALL: Colors.simAll,
  SIM1: Colors.sim1,
  SIM2: Colors.sim2,
};

const simLabels: Record<SimSelection, string> = {
  ALL: 'All SIMs',
  SIM1: 'SIM 1',
  SIM2: 'SIM 2',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function BlockedContactCard({ contact, onRemove, onToggle, onSimChange }: Props) {
  const confirmRemove = () => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.name} from blocked list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(contact.id) },
      ]
    );
  };

  return (
    <View style={[styles.card, !contact.isActive && styles.cardInactive]}>
      <View style={styles.top}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: simColors[contact.simSelection] + '22' }]}>
          <Text style={[styles.avatarText, { color: simColors[contact.simSelection] }]}>
            {getInitials(contact.name)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.numbers} numberOfLines={1}>
            {contact.phoneNumbers.join(' · ')}
          </Text>
        </View>

        {/* Toggle + Delete */}
        <View style={styles.actions}>
          <Pressable onPress={() => onToggle(contact.id)} style={styles.toggleBtn}>
            <View style={[styles.toggleTrack, contact.isActive && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, contact.isActive && styles.toggleThumbOn]} />
            </View>
          </Pressable>
          <Pressable onPress={confirmRemove} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>✕</Text>
          </Pressable>
        </View>
      </View>

      {/* SIM Selector */}
      <View style={styles.simRow}>
        <Text style={styles.simLabel}>Block on:</Text>
        <SimSelector
          value={contact.simSelection}
          onChange={(sim) => onSimChange(contact.id, sim)}
          compact
        />
      </View>

      {!contact.isActive && (
        <View style={styles.pausedBadge}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInactive: {
    opacity: 0.6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  numbers: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    padding: 4,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: Colors.success,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pausedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning + '33',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pausedText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 0.5,
  },
});
