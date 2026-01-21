import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterOptions {
  status: string[];
  type: string[];
  dateRange: string;
  amountRange: string;
}

interface TransactionFilterProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilter: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const theme = {
  primary: '#00ADFF', // Snapchat Blue
  backgroundLight: '#FFFFFF',
  backgroundDark: '#000000',
  inputLight: "#F2F2F2",
  inputDark: "#1E1E1E",
  textLight: "#000000",
  textDark: "#FFFFFF",
  textSecondaryLight: "#757575",
  textSecondaryDark: "#A0A0A0",
};

export default function TransactionFilter({
  visible,
  onClose,
  onApplyFilter,
  currentFilters
}: TransactionFilterProps) {
  const { isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const bgColor = isDark ? theme.backgroundDark : theme.backgroundLight;
  const cardBgColor = isDark ? theme.inputDark : theme.inputLight;
  const textColor = isDark ? theme.textDark : theme.textLight;
  const textSecondaryColor = isDark ? theme.textSecondaryDark : theme.textSecondaryLight;
  const borderColor = isDark ? '#333' : '#E5E7EB';

  const [tempFilters, setTempFilters] = React.useState<FilterOptions>(currentFilters);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          mass: 0.8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const statusOptions = [
    { value: 'Successful', label: 'Successful', icon: 'checkmark-circle' },
    { value: 'Failed', label: 'Failed', icon: 'close-circle' },
    { value: 'Pending', label: 'Pending', icon: 'time' },
  ];

  const typeOptions = [
    { value: 'Airtime', label: 'Airtime', icon: 'phone-portrait' },
    { value: 'Data', label: 'Data', icon: 'wifi' },
    { value: 'Wallet', label: 'Wallet', icon: 'wallet' },
  ];

  const toggleStatus = (status: string) => {
    const newStatus = tempFilters.status.includes(status)
      ? tempFilters.status.filter(s => s !== status)
      : [...tempFilters.status, status];
    setTempFilters({ ...tempFilters, status: newStatus });
  };

  const toggleType = (type: string) => {
    const newType = tempFilters.type.includes(type)
      ? tempFilters.type.filter(t => t !== type)
      : [...tempFilters.type, type];
    setTempFilters({ ...tempFilters, type: newType });
  };

  const handleApply = () => {
    onApplyFilter(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      status: [],
      type: [],
      dateRange: 'all',
      amountRange: 'all',
    };
    setTempFilters(resetFilters);
  };

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.filterSection}>
      <Text style={[styles.sectionTitle, { color: textSecondaryColor }]}>{title}</Text>
      {children}
    </View>
  );

  const FilterChip = ({
    label,
    selected,
    onPress,
    icon
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? theme.primary : cardBgColor,
          borderColor: selected ? theme.primary : 'transparent'
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={selected ? '#FFFFFF' : textSecondaryColor}
          style={styles.chipIcon}
        />
      )}
      <Text style={[
        styles.filterChipText,
        { color: selected ? '#FFFFFF' : textColor }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: bgColor,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBarContainer}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleReset}>
              <Text style={[styles.headerButtonText, { color: textSecondaryColor }]}>Reset</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>Filter</Text>
            <TouchableOpacity onPress={handleApply}>
              <Text style={[styles.headerButtonText, { color: theme.primary, fontWeight: '700' }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <FilterSection title="STATUS">
              <View style={styles.chipsContainer}>
                {statusOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={tempFilters.status.includes(option.value)}
                    onPress={() => toggleStatus(option.value)}
                    icon={option.icon}
                  />
                ))}
              </View>
            </FilterSection>

            {/* Type Filter */}
            <FilterSection title="TYPE">
              <View style={styles.chipsContainer}>
                {typeOptions.map((option) => (
                  <FilterChip
                    key={option.value}
                    label={option.label}
                    selected={tempFilters.type.includes(option.value)}
                    onPress={() => toggleType(option.value)}
                    icon={option.icon}
                  />
                ))}
              </View>
            </FilterSection>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    height: SCREEN_HEIGHT * 0.5, // Half height for better UX
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  handleBarContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});