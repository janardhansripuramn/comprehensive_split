import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/types';
import {
  Filter,
  X,
  Save,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Search,
} from 'lucide-react-native';

export interface ExpenseFilters {
  searchQuery: string;
  categories: string[];
  currencies: string[];
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  hasReceipt: boolean | null;
  isRecurring: boolean | null;
  tags: string[];
}

interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
  onSaveFilter: (name: string, filters: ExpenseFilters) => void;
  savedFilters: { name: string; filters: ExpenseFilters }[];
  onLoadFilter: (filters: ExpenseFilters) => void;
  onDeleteSavedFilter: (name: string) => void;
}

export default function AdvancedFilters({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onSaveFilter,
  savedFilters,
  onLoadFilter,
  onDeleteSavedFilter,
}: AdvancedFiltersProps) {
  const { colors } = useTheme();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');

  const updateFilter = (key: keyof ExpenseFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', categories);
  };

  const toggleCurrency = (currency: string) => {
    const currencies = filters.currencies.includes(currency)
      ? filters.currencies.filter(c => c !== currency)
      : [...filters.currencies, currency];
    updateFilter('currencies', currencies);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      categories: [],
      currencies: [],
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      hasReceipt: null,
      isRecurring: null,
      tags: [],
    });
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter(filterName.trim(), filters);
      setFilterName('');
      setShowSaveModal(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
    },
    scrollContainer: {
      padding: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    dateInput: {
      flex: 1,
    },
    amountInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    amountInput: {
      flex: 1,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    chipTextSelected: {
      color: '#FFFFFF',
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    switchLabel: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    savedFiltersSection: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    savedFilterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    savedFilterName: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    savedFilterActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
    },
    bottomButtons: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    bottomButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    bottomButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    bottomButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    bottomButtonTextPrimary: {
      color: '#FFFFFF',
    },
    saveModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveModalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '80%',
      maxWidth: 300,
    },
    saveModalTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    saveModalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    saveModalButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    saveModalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    saveModalButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    saveModalButtonTextPrimary: {
      color: '#FFFFFF',
    },
  });

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Advanced Filters</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowSaveModal(true)}
                >
                  <Save size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {/* Search */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Search</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Search Query</Text>
                  <TextInput
                    style={styles.input}
                    value={filters.searchQuery}
                    onChangeText={(text) => updateFilter('searchQuery', text)}
                    placeholder="Search description, notes, tags..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              {/* Categories */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.chipContainer}>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.chip,
                        filters.categories.includes(category) && styles.chipSelected,
                      ]}
                      onPress={() => toggleCategory(category)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.categories.includes(category) && styles.chipTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Currencies */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Currencies</Text>
                <View style={styles.chipContainer}>
                  {CURRENCIES.slice(0, 6).map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.chip,
                        filters.currencies.includes(currency.code) && styles.chipSelected,
                      ]}
                      onPress={() => toggleCurrency(currency.code)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.currencies.includes(currency.code) && styles.chipTextSelected,
                        ]}
                      >
                        {currency.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                <View style={styles.dateInputs}>
                  <View style={styles.dateInput}>
                    <Text style={styles.label}>From</Text>
                    <TextInput
                      style={styles.input}
                      value={filters.dateFrom}
                      onChangeText={(text) => updateFilter('dateFrom', text)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <View style={styles.dateInput}>
                    <Text style={styles.label}>To</Text>
                    <TextInput
                      style={styles.input}
                      value={filters.dateTo}
                      onChangeText={(text) => updateFilter('dateTo', text)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>

              {/* Amount Range */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amount Range</Text>
                <View style={styles.amountInputs}>
                  <View style={styles.amountInput}>
                    <Text style={styles.label}>Min Amount</Text>
                    <TextInput
                      style={styles.input}
                      value={filters.minAmount}
                      onChangeText={(text) => updateFilter('minAmount', text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.amountInput}>
                    <Text style={styles.label}>Max Amount</Text>
                    <TextInput
                      style={styles.input}
                      value={filters.maxAmount}
                      onChangeText={(text) => updateFilter('maxAmount', text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              {/* Additional Filters */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Filters</Text>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Has Receipt</Text>
                  <Switch
                    value={filters.hasReceipt === true}
                    onValueChange={(value) => updateFilter('hasReceipt', value ? true : null)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={filters.hasReceipt === true ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Recurring Expenses</Text>
                  <Switch
                    value={filters.isRecurring === true}
                    onValueChange={(value) => updateFilter('isRecurring', value ? true : null)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={filters.isRecurring === true ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
              </View>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <View style={styles.savedFiltersSection}>
                  <Text style={styles.sectionTitle}>Saved Filters</Text>
                  {savedFilters.map((savedFilter, index) => (
                    <View key={index} style={styles.savedFilterItem}>
                      <Text style={styles.savedFilterName}>{savedFilter.name}</Text>
                      <View style={styles.savedFilterActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => onLoadFilter(savedFilter.filters)}
                        >
                          <Search size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => onDeleteSavedFilter(savedFilter.name)}
                        >
                          <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.bottomButtons}>
              <TouchableOpacity style={styles.bottomButton} onPress={clearAllFilters}>
                <Text style={styles.bottomButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bottomButton, styles.bottomButtonPrimary]}
                onPress={onClose}
              >
                <Text style={[styles.bottomButtonText, styles.bottomButtonTextPrimary]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save Filter Modal */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.saveModalOverlay}>
          <View style={styles.saveModalContent}>
            <Text style={styles.saveModalTitle}>Save Filter</Text>
            <TextInput
              style={styles.input}
              value={filterName}
              onChangeText={setFilterName}
              placeholder="Enter filter name"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.saveModalButtons}>
              <TouchableOpacity
                style={styles.saveModalButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.saveModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveModalButton, styles.saveModalButtonPrimary]}
                onPress={handleSaveFilter}
              >
                <Text style={[styles.saveModalButtonText, styles.saveModalButtonTextPrimary]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}