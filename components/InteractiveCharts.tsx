import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getExpenses, getIncome } from '@/services/firestore';
import { Expense, Income } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PieChart,
  BarChart,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface TrendData {
  period: string;
  expenses: number;
  income: number;
}

interface InteractiveChartsProps {
  visible: boolean;
  onClose: () => void;
}

export default function InteractiveCharts({ visible, onClose }: InteractiveChartsProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [selectedChart, setSelectedChart] = useState<'category' | 'trend' | 'comparison'>('category');
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadData();
    }
  }, [visible, user, selectedPeriod]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [expensesData, incomeData] = await Promise.all([
        getExpenses(user.uid),
        getIncome(user.uid)
      ]);
      
      setExpenses(expensesData);
      setIncome(incomeData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = (): ChartData[] => {
    const categoryTotals: { [key: string]: number } = {};
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const colors_list = [colors.primary, colors.secondary, colors.accent, colors.warning, colors.error, colors.success];
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        color: colors_list[index % colors_list.length],
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const getTrendData = (): TrendData[] => {
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
      
      last6Months.push({
        period: date.toLocaleDateString('default', { month: 'short' }),
        expenses: monthExpenses,
        income: monthIncome,
      });
    }
    
    return last6Months;
  };

  const renderPieChart = (data: ChartData[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.pieChartWrapper}>
          {/* Simple pie chart representation */}
          <View style={styles.pieChart}>
            {data.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: item.color,
                    width: `${item.percentage}%`,
                    height: 8,
                  }
                ]}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.chartLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <View style={styles.legendText}>
                <Text style={styles.legendLabel}>{item.name}</Text>
                <Text style={styles.legendValue}>
                  ${item.value.toFixed(2)} ({item.percentage.toFixed(1)}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBarChart = (data: TrendData[]) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.expenses, d.income)));
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.barChart}>
          {data.map((item, index) => (
            <View key={index} style={styles.barGroup}>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    styles.expenseBar,
                    { height: maxValue > 0 ? (item.expenses / maxValue) * 120 : 0 }
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    styles.incomeBar,
                    { height: maxValue > 0 ? (item.income / maxValue) * 120 : 0 }
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{item.period}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.barLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
            <Text style={styles.legendLabel}>Expenses</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
            <Text style={styles.legendLabel}>Income</Text>
          </View>
        </View>
      </View>
    );
  };

  const categoryData = getCategoryData();
  const trendData = getTrendData();
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

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
    chartTypeSelector: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 8,
    },
    chartTypeButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartTypeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chartTypeIcon: {
      marginBottom: 8,
    },
    chartTypeText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    chartTypeTextActive: {
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
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pieChartWrapper: {
      alignItems: 'center',
      marginBottom: 24,
    },
    pieChart: {
      flexDirection: 'row',
      width: 200,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    pieSlice: {
      height: '100%',
    },
    chartLegend: {
      marginTop: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    legendText: {
      flex: 1,
    },
    legendLabel: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    legendValue: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    barChart: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 160,
      marginBottom: 20,
    },
    barGroup: {
      alignItems: 'center',
    },
    barContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      marginBottom: 8,
    },
    bar: {
      width: 12,
      borderRadius: 6,
      minHeight: 4,
    },
    expenseBar: {
      backgroundColor: colors.error,
    },
    incomeBar: {
      backgroundColor: colors.success,
    },
    barLabel: {
      fontSize: 10,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    barLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
    },
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChart === 'category' && styles.chartTypeButtonActive,
            ]}
            onPress={() => setSelectedChart('category')}
          >
            <View style={styles.chartTypeIcon}>
              <PieChart size={20} color={selectedChart === 'category' ? '#FFFFFF' : colors.text} />
            </View>
            <Text
              style={[
                styles.chartTypeText,
                selectedChart === 'category' && styles.chartTypeTextActive,
              ]}
            >
              Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChart === 'trend' && styles.chartTypeButtonActive,
            ]}
            onPress={() => setSelectedChart('trend')}
          >
            <View style={styles.chartTypeIcon}>
              <TrendingUp size={20} color={selectedChart === 'trend' ? '#FFFFFF' : colors.text} />
            </View>
            <Text
              style={[
                styles.chartTypeText,
                selectedChart === 'trend' && styles.chartTypeTextActive,
              ]}
            >
              Trends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              selectedChart === 'comparison' && styles.chartTypeButtonActive,
            ]}
            onPress={() => setSelectedChart('comparison')}
          >
            <View style={styles.chartTypeIcon}>
              <BarChart size={20} color={selectedChart === 'comparison' ? '#FFFFFF' : colors.text} />
            </View>
            <Text
              style={[
                styles.chartTypeText,
                selectedChart === 'comparison' && styles.chartTypeTextActive,
              ]}
            >
              Compare
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalExpenses.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalIncome.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Income</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${(totalIncome - totalExpenses).toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Net Savings</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Chart Content */}
        {selectedChart === 'category' && renderPieChart(categoryData)}
        {selectedChart === 'trend' && renderBarChart(trendData)}
        {selectedChart === 'comparison' && renderBarChart(trendData)}
      </ScrollView>
    </View>
  );
}