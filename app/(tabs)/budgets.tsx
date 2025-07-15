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
import { addBudget, getBudgets, getExpenses } from '@/services/firestore';
import { Budget, Expense, EXPENSE_CATEGORIES } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X,
  PieChart,
} from 'lucide-react-native';

export default function BudgetsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: '',
    currency: 'USD',
    month: currentMonth,
  });

  useEffect(() => {
    if (user) {
      loadBudgets();
      loadExpenses();
    }
  }, [user]);

  const loadBudgets = async () => {
    if (!user) return;
    
    try {
      const data = await getBudgets(user.uid, currentMonth);
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  };

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      const data = await getExpenses(user.uid);
      // Filter expenses for current month
      const currentMonthExpenses = data.filter(expense => {
        const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
        return expenseMonth === currentMonth;
      });
      setExpenses(currentMonthExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleAddBudget = async () => {
    if (!formData.category || !formData.amount.trim() || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check if budget already exists for this category and month
    const existingBudget = budgets.find(
      budget => budget.category === formData.category && budget.month === formData.month
    );

    if (existingBudget) {
      Alert.alert('Error', 'Budget already exists for this category this month');
      return;
    }

    setLoading(true);
    try {
      await addBudget({
        userId: user.uid,
        category: formData.category,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        month: formData.month,
      });

      Alert.alert('Success', 'Budget added successfully!');
      resetForm();
      setShowAddModal(false);
      loadBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
      Alert.alert('Error', 'Failed to add budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      currency: 'USD',
      month: currentMonth,
    });
  };

  const getBudgetProgress = (budget: Budget) => {
    const categoryExpenses = expenses.filter(
      expense => expense.category === budget.category && expense.currency === budget.currency
    );
    const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      spent,
      remaining: budget.amount - spent,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.amount,
    };
  };

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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
      marginBottom: 8,
    },
    monthText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
    },
    summaryCard: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
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
    progressBar: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 4,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    budgetInfo: {
      flex: 1,
    },
    budgetCategory: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    budgetAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
    onTrackBadge: {
      backgroundColor: colors.success + '20',
    },
    onTrackText: {
      color: colors.success,
    },
    overBudgetBadge: {
      backgroundColor: colors.error + '20',
    },
    overBudgetText: {
      color: colors.error,
    },
    warningBadge: {
      backgroundColor: colors.warning + '20',
    },
    warningText: {
      color: colors.warning,
    },
    budgetProgress: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    progressText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    progressPercentage: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.textSecondary,
    },
    budgetProgressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    budgetProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    budgetStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '85%',
      maxWidth: 400,
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
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
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

  const getStatusBadge = (progress: any) => {
    if (progress.isOverBudget) {
      return (
        <View style={[styles.statusBadge, styles.overBudgetBadge]}>
          <AlertTriangle size={12} color={colors.error} />
          <Text style={[styles.statusText, styles.overBudgetText]}>Over Budget</Text>
        </View>
      );
    } else if (progress.percentage > 80) {
      return (
        <View style={[styles.statusBadge, styles.warningBadge]}>
          <AlertTriangle size={12} color={colors.warning} />
          <Text style={[styles.statusText, styles.warningText]}>Warning</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusBadge, styles.onTrackBadge]}>
          <Target size={12} color={colors.success} />
          <Text style={[styles.statusText, styles.onTrackText]}>On Track</Text>
        </View>
      );
    }
  };

  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Budgets</Text>
        <Text style={styles.monthText}>
          {new Date(currentMonth + '-01').toLocaleDateString('default', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Text>

        {/* Summary Card */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalBudgeted.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Budgeted</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalSpent.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Spent</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${(totalBudgeted - totalSpent).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(overallProgress, 100)}%` }
              ]}
            />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {budgets.length === 0 ? (
          <View style={styles.emptyState}>
            <PieChart size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No budgets set for this month. Create your first budget to start tracking your spending!
            </Text>
          </View>
        ) : (
          budgets.map((budget) => {
            const progress = getBudgetProgress(budget);
            return (
              <View key={budget.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetCategory}>{budget.category}</Text>
                    <Text style={styles.budgetAmount}>${budget.amount} {budget.currency}</Text>
                  </View>
                  {getStatusBadge(progress)}
                </View>

                <View style={styles.budgetProgress}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>
                      ${progress.spent} spent
                    </Text>
                    <Text style={styles.progressPercentage}>
                      {progress.percentage.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.budgetProgressBar}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${progress.percentage}%`,
                          backgroundColor: progress.isOverBudget 
                            ? colors.error 
                            : progress.percentage > 80 
                            ? colors.warning 
                            : colors.success,
                        }
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.budgetStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${progress.spent}</Text>
                    <Text style={styles.statLabel}>Spent</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[
                      styles.statValue,
                      { color: progress.remaining < 0 ? colors.error : colors.success }
                    ]}>
                      ${Math.abs(progress.remaining)}
                    </Text>
                    <Text style={styles.statLabel}>
                      {progress.remaining < 0 ? 'Over' : 'Remaining'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${budget.amount}</Text>
                    <Text style={styles.statLabel}>Budget</Text>
                  </View>
                </View>
              </View>
            );
          })
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
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Add Budget Modal */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Budget</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                placeholder="Select category"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Budget Amount</Text>
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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddBudget}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Creating...' : 'Create Budget'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}