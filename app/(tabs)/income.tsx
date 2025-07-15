import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { addIncome, getIncome } from '@/services/firestore';
import { Income, CURRENCIES } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
} from 'lucide-react-native';

export default function IncomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadIncome();
    }
  }, [user]);

  const loadIncome = async () => {
    if (!user) return;
    
    try {
      const data = await getIncome(user.uid);
      setIncomeList(data);
    } catch (error) {
      console.error('Error loading income:', error);
    }
  };

  const handleAddIncome = async () => {
    if (!formData.source.trim() || !formData.amount.trim() || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addIncome({
        userId: user.uid,
        source: formData.source.trim(),
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date),
        notes: formData.notes.trim(),
      });

      Alert.alert('Success', 'Income added successfully!');
      resetForm();
      setShowAddModal(false);
      loadIncome();
    } catch (error) {
      console.error('Error adding income:', error);
      Alert.alert('Error', 'Failed to add income. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const filteredIncome = incomeList.filter(income =>
    income.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    income.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalIncome = incomeList.reduce((sum, income) => sum + income.amount, 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 24,
      paddingTop: 60,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 24,
    },
    summaryCard: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
    },
    summaryTitle: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      opacity: 0.9,
      marginBottom: 8,
    },
    summaryAmount: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    searchContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
    },
    searchWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginLeft: 12,
    },
    filterButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    incomeItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    incomeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    incomeLeft: {
      flex: 1,
    },
    incomeSource: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    incomeNotes: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    incomeRight: {
      alignItems: 'flex-end',
    },
    incomeAmount: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.success,
      marginBottom: 4,
    },
    incomeDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    addButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    inputContainer: {
      marginBottom: 20,
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
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: colors.success,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Income</Text>
        
        {/* Summary Card */}
        <LinearGradient
          colors={[colors.success, colors.accent]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.summaryTitle}>Total Income</Text>
          <Text style={styles.summaryAmount}>${totalIncome.toLocaleString()}</Text>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search income..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {filteredIncome.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No income found matching your search' : 'No income recorded yet. Add your first income entry!'}
            </Text>
          </View>
        ) : (
          filteredIncome.map((income) => (
            <TouchableOpacity key={income.id} style={styles.incomeItem}>
              <View style={styles.incomeHeader}>
                <View style={styles.incomeLeft}>
                  <Text style={styles.incomeSource}>{income.source}</Text>
                  {income.notes && (
                    <Text style={styles.incomeNotes}>{income.notes}</Text>
                  )}
                </View>
                <View style={styles.incomeRight}>
                  <Text style={styles.incomeAmount}>+${income.amount}</Text>
                  <Text style={styles.incomeDate}>
                    {new Date(income.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <LinearGradient
        colors={[colors.success, colors.accent]}
        style={styles.addButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: 'transparent' }]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Add Income Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Income</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Source *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.source}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, source: text }))}
                  placeholder="e.g., Salary, Freelance, Investment"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Currency</Text>
                <TextInput
                  style={styles.input}
                  value={formData.currency}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, currency: text }))}
                  placeholder="USD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={formData.date}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="Add notes..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddIncome}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Adding...' : 'Add Income'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}