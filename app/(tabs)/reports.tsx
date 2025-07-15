import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { 
  getExpenses, 
  getIncome, 
  getBudgets, 
  getGroups,
  generateExportData 
} from '@/services/firestore';
import { Expense, Income, Budget, Group } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import InteractiveCharts from '@/components/InteractiveCharts';
import DataExport from '@/components/DataExport';
import {
  BarChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Users,
  Download,
  Eye,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Zap,
  Brain,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Percent,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
  transactions: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  budgetUsed: number;
}

interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'trend';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'trends' | 'insights'>('overview');
  const [showCharts, setShowCharts] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReportData();
    }
  }, [user, selectedPeriod]);

  const loadReportData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [expensesData, incomeData, budgetsData, groupsData] = await Promise.all([
        getExpenses(user.uid),
        getIncome(user.uid),
        getBudgets(user.uid),
        getGroups(user.uid)
      ]);

      setExpenses(expensesData);
      setIncome(incomeData);
      setBudgets(budgetsData);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedPeriod) {
      case 'this-week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  };

  const getFilteredData = () => {
    const { startDate, endDate } = getDateRange();
    
    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const filteredIncome = income.filter(inc => {
      const incomeDate = new Date(inc.date);
      return incomeDate >= startDate && incomeDate <= endDate;
    });

    return { filteredExpenses, filteredIncome };
  };

  const getCategoryData = (): CategoryData[] => {
    const { filteredExpenses } = getFilteredData();
    const categoryTotals: { [key: string]: { amount: number; count: number } } = {};
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    filteredExpenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = { amount: 0, count: 0 };
      }
      categoryTotals[expense.category].amount += expense.amount;
      categoryTotals[expense.category].count += 1;
    });

    const colors_list = [colors.primary, colors.secondary, colors.accent, colors.warning, colors.error, colors.success];
    
    return Object.entries(categoryTotals)
      .map(([category, data], index) => ({
        category,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        color: colors_list[index % colors_list.length],
        trend: Math.random() > 0.5 ? 'up' : 'down', // Mock trend data
        transactions: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getMonthlyData = (): MonthlyData[] => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      
      const monthExpenses = expenses
        .filter(expense => expense.date.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, expense) => sum + expense.amount, 0);
        
      const monthIncome = income
        .filter(inc => inc.date.toISOString().slice(0, 7) === monthKey)
        .reduce((sum, inc) => sum + inc.amount, 0);

      const monthBudgets = budgets
        .filter(budget => budget.month === monthKey)
        .reduce((sum, budget) => sum + budget.amount, 0);
      
      last6Months.push({
        month: date.toLocaleDateString('default', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses,
        budgetUsed: monthBudgets > 0 ? (monthExpenses / monthBudgets) * 100 : 0,
      });
    }
    
    return last6Months;
  };

  const getAIInsights = (): AIInsight[] => {
    const { filteredExpenses, filteredIncome } = getFilteredData();
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const categoryData = getCategoryData();
    const monthlyData = getMonthlyData();
    
    const insights: AIInsight[] = [];

    // Budget analysis
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = budgets.filter(budget => budget.month === currentMonth);
    const totalBudget = currentBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    
    if (totalBudget > 0) {
      const budgetUsage = (totalExpenses / totalBudget) * 100;
      
      if (budgetUsage > 90) {
        insights.push({
          id: 'budget-warning',
          type: 'warning',
          title: 'Budget Alert',
          description: `You've used ${budgetUsage.toFixed(0)}% of your monthly budget. Consider reducing spending in high categories.`,
          action: 'Review Budget',
          priority: 'high',
          icon: <AlertCircle size={20} color={colors.error} />,
        });
      } else if (budgetUsage < 70) {
        insights.push({
          id: 'budget-good',
          type: 'achievement',
          title: 'Great Budget Control',
          description: `You're doing well! Only ${budgetUsage.toFixed(0)}% of your budget used this month.`,
          priority: 'low',
          icon: <CheckCircle size={20} color={colors.success} />,
        });
      }
    }

    // Spending trends
    if (monthlyData.length >= 2) {
      const thisMonth = monthlyData[monthlyData.length - 1];
      const lastMonth = monthlyData[monthlyData.length - 2];
      const expenseChange = ((thisMonth.expenses - lastMonth.expenses) / lastMonth.expenses) * 100;
      
      if (expenseChange > 20) {
        insights.push({
          id: 'spending-increase',
          type: 'warning',
          title: 'Spending Increased',
          description: `Your expenses increased by ${expenseChange.toFixed(0)}% compared to last month.`,
          action: 'Analyze Categories',
          priority: 'medium',
          icon: <TrendingUp size={20} color={colors.warning} />,
        });
      } else if (expenseChange < -10) {
        insights.push({
          id: 'spending-decrease',
          type: 'achievement',
          title: 'Spending Reduced',
          description: `Great job! You reduced expenses by ${Math.abs(expenseChange).toFixed(0)}% this month.`,
          priority: 'low',
          icon: <TrendingDown size={20} color={colors.success} />,
        });
      }
    }

    // Category insights
    if (categoryData.length > 0) {
      const topCategory = categoryData[0];
      if (topCategory.percentage > 40) {
        insights.push({
          id: 'category-concentration',
          type: 'tip',
          title: 'High Category Concentration',
          description: `${topCategory.category} accounts for ${topCategory.percentage.toFixed(0)}% of your spending. Consider diversifying or budgeting.`,
          action: 'Set Category Budget',
          priority: 'medium',
          icon: <PieChart size={20} color={colors.primary} />,
        });
      }
    }

    // Savings insights
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    if (savingsRate > 20) {
      insights.push({
        id: 'good-savings',
        type: 'achievement',
        title: 'Excellent Savings Rate',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep up the great work!`,
        priority: 'low',
        icon: <Award size={20} color={colors.success} />,
      });
    } else if (savingsRate < 5) {
      insights.push({
        id: 'low-savings',
        type: 'tip',
        title: 'Improve Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(0)}%. Try to save at least 10-20% of your income.`,
        action: 'Create Savings Plan',
        priority: 'high',
        icon: <Target size={20} color={colors.warning} />,
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const { filteredExpenses, filteredIncome } = getFilteredData();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const aiInsights = getAIInsights();

  const periods = [
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'this-quarter', label: 'This Quarter' },
    { value: 'this-year', label: 'This Year' },
  ];

  const views = [
    { value: 'overview', label: 'Overview', icon: Activity },
    { value: 'categories', label: 'Categories', icon: PieChart },
    { value: 'trends', label: 'Trends', icon: TrendingUp },
    { value: 'insights', label: 'AI Insights', icon: Brain },
  ];

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
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
    },
    controls: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
    },
    periodSelector: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    periodButtonTextActive: {
      color: '#FFFFFF',
    },
    actionButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    viewSelector: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 8,
    },
    viewButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    viewButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    viewButtonIcon: {
      marginBottom: 8,
    },
    viewButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    viewButtonTextActive: {
      color: '#FFFFFF',
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
    savingsRow: {
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.2)',
    },
    savingsValue: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    savingsLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      opacity: 0.9,
    },
    savingsRate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: '#FFFFFF',
      opacity: 0.8,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    categoryItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    categoryTransactions: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    categoryAmount: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    categoryPercentage: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    monthlyItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    monthlyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthlyMonth: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    monthlySavings: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
    },
    monthlyStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    monthlyStat: {
      alignItems: 'center',
    },
    monthlyStatValue: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 2,
    },
    monthlyStatLabel: {
      fontSize: 10,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    insightItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    insightIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    insightDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    insightAction: {
      marginTop: 12,
      alignSelf: 'flex-start',
    },
    actionButtonSmall: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    priorityBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priorityText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
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
    chartPlaceholder: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 40,
      alignItems: 'center',
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartPlaceholderText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginTop: 16,
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case 'warning':
        return colors.error;
      case 'tip':
        return colors.primary;
      case 'achievement':
        return colors.success;
      case 'trend':
        return colors.secondary;
      default:
        return colors.border;
    }
  };

  const renderOverview = () => (
    <>
      {/* Summary Card */}
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
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{filteredExpenses.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
        </View>
        <View style={styles.savingsRow}>
          <Text style={styles.savingsValue}>
            {netSavings >= 0 ? '+' : ''}${netSavings.toLocaleString()}
          </Text>
          <Text style={styles.savingsLabel}>Net Savings</Text>
          <Text style={styles.savingsRate}>
            {savingsRate.toFixed(1)}% savings rate
          </Text>
        </View>
      </LinearGradient>

      {/* Chart Placeholder */}
      <TouchableOpacity 
        style={styles.chartPlaceholder}
        onPress={() => setShowCharts(true)}
      >
        <BarChart size={48} color={colors.primary} />
        <Text style={styles.chartPlaceholderText}>
          Tap to view interactive charts
        </Text>
      </TouchableOpacity>

      {/* Top Categories Preview */}
      <Text style={styles.sectionTitle}>Top Categories</Text>
      {categoryData.slice(0, 3).map((category, index) => (
        <View 
          key={category.category} 
          style={[styles.categoryItem, { borderLeftColor: category.color }]}
        >
          <View style={styles.categoryHeader}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.category}</Text>
              <Text style={styles.categoryTransactions}>
                {category.transactions} transaction{category.transactions !== 1 ? 's' : ''}
              </Text>
            </View>
            <View>
              <Text style={styles.categoryAmount}>
                ${category.amount.toLocaleString()}
              </Text>
              <Text style={styles.categoryPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${category.percentage}%`,
                  backgroundColor: category.color,
                }
              ]}
            />
          </View>
        </View>
      ))}
    </>
  );

  const renderCategories = () => (
    <>
      <Text style={styles.sectionTitle}>All Categories</Text>
      {categoryData.length === 0 ? (
        <View style={styles.emptyState}>
          <PieChart size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            No expense data available for the selected period
          </Text>
        </View>
      ) : (
        categoryData.map((category) => (
          <View 
            key={category.category} 
            style={[styles.categoryItem, { borderLeftColor: category.color }]}
          >
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.category}</Text>
                <Text style={styles.categoryTransactions}>
                  {category.transactions} transaction{category.transactions !== 1 ? 's' : ''}
                </Text>
              </View>
              <View>
                <Text style={styles.categoryAmount}>
                  ${category.amount.toLocaleString()}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }
                ]}
              />
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderTrends = () => (
    <>
      <Text style={styles.sectionTitle}>Monthly Trends</Text>
      {monthlyData.map((month) => (
        <View key={month.month} style={styles.monthlyItem}>
          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyMonth}>{month.month}</Text>
            <Text style={[
              styles.monthlySavings,
              { color: month.savings >= 0 ? colors.success : colors.error }
            ]}>
              {month.savings >= 0 ? '+' : ''}${month.savings.toLocaleString()}
            </Text>
          </View>
          <View style={styles.monthlyStats}>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>
                ${month.income.toLocaleString()}
              </Text>
              <Text style={styles.monthlyStatLabel}>Income</Text>
            </View>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>
                ${month.expenses.toLocaleString()}
              </Text>
              <Text style={styles.monthlyStatLabel}>Expenses</Text>
            </View>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>
                {month.budgetUsed.toFixed(0)}%
              </Text>
              <Text style={styles.monthlyStatLabel}>Budget Used</Text>
            </View>
          </View>
        </View>
      ))}
    </>
  );

  const renderInsights = () => (
    <>
      <Text style={styles.sectionTitle}>AI-Powered Insights</Text>
      {aiInsights.length === 0 ? (
        <View style={styles.emptyState}>
          <Brain size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateText}>
            No insights available. Add more expenses to get personalized recommendations.
          </Text>
        </View>
      ) : (
        aiInsights.map((insight) => (
          <View 
            key={insight.id} 
            style={[
              styles.insightItem, 
              { borderLeftColor: getInsightBorderColor(insight.type) }
            ]}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightIcon}>
                {insight.icon}
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>
                  {insight.description}
                </Text>
                {insight.action && (
                  <View style={styles.insightAction}>
                    <TouchableOpacity style={styles.actionButtonSmall}>
                      <Text style={styles.actionButtonText}>{insight.action}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(insight.priority) + '20' }
            ]}>
              <Text style={[
                styles.priorityText,
                { color: getPriorityColor(insight.priority) }
              ]}>
                {insight.priority}
              </Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>Comprehensive insights into your finances</Text>

        {/* Period Selector */}
        <View style={styles.controls}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.periodSelector}
          >
            {periods.map((period) => (
              <TouchableOpacity
                key={period.value}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.value && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period.value)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive,
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowExport(true)}
          >
            <Download size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* View Selector */}
        <View style={styles.viewSelector}>
          {views.map((view) => (
            <TouchableOpacity
              key={view.value}
              style={[
                styles.viewButton,
                selectedView === view.value && styles.viewButtonActive,
              ]}
              onPress={() => setSelectedView(view.value as any)}
            >
              <View style={styles.viewButtonIcon}>
                <view.icon 
                  size={20} 
                  color={selectedView === view.value ? '#FFFFFF' : colors.text} 
                />
              </View>
              <Text
                style={[
                  styles.viewButtonText,
                  selectedView === view.value && styles.viewButtonTextActive,
                ]}
              >
                {view.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {selectedView === 'overview' && renderOverview()}
        {selectedView === 'categories' && renderCategories()}
        {selectedView === 'trends' && renderTrends()}
        {selectedView === 'insights' && renderInsights()}
      </ScrollView>

      {/* Interactive Charts Modal */}
      <InteractiveCharts
        visible={showCharts}
        onClose={() => setShowCharts(false)}
      />

      {/* Data Export Modal */}
      <DataExport
        visible={showExport}
        onClose={() => setShowExport(false)}
      />
    </View>
  );
}