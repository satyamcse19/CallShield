import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SimSelection } from '../store/useBlockedContacts';
import { Colors } from '../constants/colors';

interface SimSelectorProps {
  value: SimSelection;
  onChange: (value: SimSelection) => void;
  compact?: boolean;
}

const options: { label: string; value: SimSelection; color: string }[] = [
  { label: 'All SIMs', value: 'ALL', color: Colors.simAll },
  { label: 'SIM 1', value: 'SIM1', color: Colors.sim1 },
  { label: 'SIM 2', value: 'SIM2', color: Colors.sim2 },
];

export default function SimSelector({ value, onChange, compact = false }: SimSelectorProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              compact && styles.optionCompact,
              active && { backgroundColor: opt.color, borderColor: opt.color },
              !active && styles.optionInactive,
            ]}
          >
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                { color: active ? Colors.white : opt.color },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  containerCompact: {
    gap: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  optionCompact: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    flex: 0,
    borderRadius: 6,
  },
  optionInactive: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  label: {
    fontWeight: '600',
    fontSize: 13,
  },
  labelCompact: {
    fontSize: 11,
  },
});
