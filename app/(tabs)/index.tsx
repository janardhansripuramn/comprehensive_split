import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  getExpenses, 
  getIncome, 
  getBudgets, 
  getReminders,
  getGroups,
  getFriends 
} from '@/services/firestore';
import { Expense, Income, Budget, Reminder, Group } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Bell,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      const [
        expensesData,
        incomeData,
        budgetsData,
        remindersData,
        groupsData,
        friendsData
      ] = await Promise.all([
        getExpenses(user.uid, { limit: 10 }),
        getIncome(user.uid),
        getBudgets(user.uid),
        getReminders(user.uid),
        getGroups(user.uid),
        getFriends(user.uid)
      ]);

      setExpenses(expensesData);
      setIncome(incomeData);
      setBudgets(budgetsData);
      setReminders(remindersData);
      setGroups(groupsData);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Calculate current month data
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
    return expenseMonth === currentMonth;
  });
  const currentMonthIncome = income.filter(inc => {
    const incomeMonth = new Date(inc.date).toISOString().slice(0, 7);
    return incomeMonth === currentMonth;
  });

  const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = currentMonthIncome.reduce((sum, inc) => sum + inc.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  // Budget progress
  const currentMonthBudgets = budgets.filter(budget => budget.month === currentMonth);
  const totalBudgeted = currentMonthBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const budgetProgress = totalBudgeted > 0 ? (totalExpenses / totalBudgeted) * 100 : 0;

  // Recent activity
  const recentExpenses = expenses.slice(0, 3);
  
  // Overdue reminders
  const overdueReminders = reminders.filter(reminder => 
    !reminder.completed && new Date(reminder.dueDate) < new Date()
  );

  // Top categories
  const categoryTotals: { [key: string]: number } = {};
  currentMonthExpenses.forEach(expense => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
  });
  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 24,
      paddingTop: 60,
    },
    greeting: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
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
    netSavings: {
      alignItems: 'center',
      marginTop: 8,
    },
    netSavingsValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    netSavingsLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      opacity: 0.9,
    },
    quickActions: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionIcon: {
      marginBottom: 8,
    },
    quickActionText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    budgetTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    budgetAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    recentExpenseItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    expenseLeft: {
      flex: 1,
    },
    expenseDescription: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    expenseCategory: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    expenseAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.error,
    },
    categoryItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryName: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    categoryAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    alertCard: {
      backgroundColor: colors.warning + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.warning,
      flexDirection: 'row',
      alignItems: 'center',
    },
    alertIcon: {
      marginRight: 12,
    },
    alertText: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.warning,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      width: (width - 60) / 2,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    viewAllButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignSelf: 'flex-end',
      marginBottom: 16,
    },
    viewAllText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      padding: 20,
    },
    emptyStateText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return colors.error;
    if (percentage > 80) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}!
        </Text>
        <Text style={styles.subtitle}>Here's your financial overview</Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Financial Summary */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalIncome.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Income</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalExpenses.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Expenses</Text>
            </View>
          </View>
          <View style={styles.netSavings}>
            <Text style={styles.netSavingsValue}>
              {netSavings >= 0 ? '+' : ''}${netSavings.toLocaleString()}
            </Text>
            <Text style={styles.netSavingsLabel}>Net Savings This Month</Text>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/expenses')}
          >
            <View style={styles.quickActionIcon}>
              <Plus size={24} color={colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Add Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/income')}
          >
            <View style={styles.quickActionIcon}>
              <TrendingUp size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Add Income</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/budgets')}
          >
            <View style={styles.quickActionIcon}>
              <Target size={24} color={colors.accent} />
            </View>
            <Text style={styles.quickActionText}>View Budgets</Text>
          </TouchableOpacity>
        </View>

        {/* Alerts */}
        {overdueReminders.length > 0 && (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => router.push('/reminders')}
          >
            <View style={styles.alertIcon}>
              <AlertTriangle size={20} color={colors.warning} />
            </View>
            <Text style={styles.alertText}>
              You have {overdueReminders.length} overdue reminder{overdueReminders.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        )}

        {budgetProgress > 90 && (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => router.push('/budgets')}
          >
            <View style={styles.alertIcon}>
              <AlertTriangle size={20} color={colors.warning} />
            </View>
            <Text style={styles.alertText}>
              You've used {budgetProgress.toFixed(0)}% of your monthly budget
            </Text>
          </TouchableOpacity>
        )}

        {/* Budget Progress */}
        {totalBudgeted > 0 && (
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetTitle}>Monthly Budget</Text>
              <Text style={styles.budgetAmount}>
                ${totalExpenses.toLocaleString()} / ${totalBudgeted.toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(budgetProgress, 100)}%`,
                    backgroundColor: getProgressColor(budgetProgress),
                  }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {budgetProgress.toFixed(1)}% used • ${(totalBudgeted - totalExpenses).toLocaleString()} remaining
            </Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{groups.length}</Text>
            <Text style={styles.statLabel}>Active Groups</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Users size={24} color={colors.secondary} />
            </View>
            <Text style={styles.statValue}>{friends.length}</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Bell size={24} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{reminders.filter(r => !r.completed).length}</Text>
            <Text style={styles.statLabel}>Pending Reminders</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Calendar size={24} color={colors.accent} />
            </View>
            <Text style={styles.statValue}>{currentMonthExpenses.length}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/expenses')}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <DollarSign size={32} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No recent expenses</Text>
          </View>
        ) : (
          recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.recentExpenseItem}>
              <View style={styles.expenseLeft}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
              </View>
              <Text style={styles.expenseAmount}>
                -${expense.amount} {expense.currency}
              </Text>
            </View>
          ))
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Categories This Month</Text>
            {topCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryAmount}>
                  ${category.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}