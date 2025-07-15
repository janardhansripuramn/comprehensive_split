import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  getGroups, 
  getExpenses, 
  addExpense, 
  updateGroup, 
  addGroupMember, 
  removeGroupMember 
} from '@/services/firestore';
import { Group, Expense } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Users,
  Plus,
  DollarSign,
  Calendar,
  Settings,
  UserPlus,
  UserMinus,
  Edit3,
  Trash2,
} from 'lucide-react-native';

export default function GroupDetailsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Form states
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: 'Food & Dining',
    notes: '',
  });
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadGroupDetails();
    }
  }, [id, user]);

  const loadGroupDetails = async () => {
    if (!id || !user) return;
    
    setLoading(true);
    try {
      const [groupsData, expensesData] = await Promise.all([
        getGroups(user.uid),
        getExpenses(user.uid, { groupId: id })
      ]);
      
      const currentGroup = groupsData.find(g => g.id === id);
      if (!currentGroup) {
        Alert.alert('Error', 'Group not found');
        router.back();
        return;
      }
      
      setGroup(currentGroup);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description.trim() || !expenseForm.amount.trim() || !user || !group) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await addExpense({
        userId: user.uid,
        description: expenseForm.description.trim(),
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        currency: 'USD',
        date: new Date(),
        notes: expenseForm.notes.trim(),
        groupId: group.id,
        tags: [],
        isRecurring: false,
      });

      Alert.alert('Success', 'Expense added successfully!');
      setExpenseForm({
        description: '',
        amount: '',
        category: 'Food & Dining',
        notes: '',
      });
      setShowAddExpense(false);
      loadGroupDetails();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !group) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setSubmitting(true);
    try {
      // In a real app, you'd look up the user by email first
      // For now, we'll just show a success message
      Alert.alert('Success', 'Member invitation sent!');
      setMemberEmail('');
      setShowAddMember(false);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const userExpenses = expenses.filter(expense => expense.userId === user?.uid);
  const userTotal = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 24,
      paddingTop: 60,
    },
    backButton: {
      marginRight: 16,
      padding: 8,
    },
    headerContent: {
      flex: 1,
    },
    groupName: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    groupMembers: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    settingsButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 16,
    },
    summaryCard: {
      margin: 24,
      borderRadius: 20,
      padding: 24,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryValue: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    summaryLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#FFFFFF',
      opacity: 0.8,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    expenseItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    expenseLeft: {
      flex: 1,
    },
    expenseDescription: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    expenseCategory: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    expenseNotes: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    expenseRight: {
      alignItems: 'flex-end',
    },
    expenseAmount: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.error,
      marginBottom: 4,
    },
    expenseDate: {
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
    modalTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
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
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    modalButtonTextPrimary: {
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.groupName}>Loading...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.groupName}>Group Not Found</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMembers}>
            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Settings size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${totalExpenses.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${userTotal.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Your Expenses</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No expenses in this group yet. Add the first expense to get started!
            </Text>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                  <Text style={styles.expenseCategory}>{expense.category}</Text>
                  {expense.notes && (
                    <Text style={styles.expenseNotes}>{expense.notes}</Text>
                  )}
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>
                    ${expense.amount} {expense.currency}
                  </Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.addButton}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: 'transparent' }]}
          onPress={() => setShowAddExpense(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddExpense}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddExpense(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Group Expense</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.description}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, description: text }))}
                placeholder="Enter expense description"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.amount}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                value={expenseForm.category}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, category: text }))}
                placeholder="Food & Dining"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={expenseForm.notes}
                onChangeText={(text) => setExpenseForm(prev => ({ ...prev, notes: text }))}
                placeholder="Add notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddExpense(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddExpense}
                disabled={submitting}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {submitting ? 'Adding...' : 'Add Expense'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}