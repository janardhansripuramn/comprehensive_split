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
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getExpenses, deleteExpense, updateExpense } from '@/services/firestore';
import { Expense } from '@/types';
import ExpenseTemplates from '@/components/ExpenseTemplates';
import AdvancedFilters, { ExpenseFilters } from '@/components/AdvancedFilters';
import BulkExpenseActions from '@/components/BulkExpenseActions';
import ReceiptScanner from '@/components/ReceiptScanner';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  Camera,
  Edit3,
  Trash2,
  MoreVertical,
  X,
  Template,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface EnhancedExpensesListProps {
  onAddExpense?: () => void;
}

export default function EnhancedExpensesList({ onAddExpense }: EnhancedExpensesListProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showExpenseMenu, setShowExpenseMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<ExpenseFilters>({
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

  const [savedFilters, setSavedFilters] = useState<{ name: string; filters: ExpenseFilters }[]>([]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [expenses, searchQuery, filters]);

  const loadExpenses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await getExpenses(user.uid);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...expenses];

    // Search filter
    if (searchQuery || filters.searchQuery) {
      const query = searchQuery || filters.searchQuery;
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(query.toLowerCase()) ||
        expense.category.toLowerCase().includes(query.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(query.toLowerCase()) ||
        expense.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(expense => filters.categories.includes(expense.category));
    }

    // Currency filter
    if (filters.currencies.length > 0) {
      filtered = filtered.filter(expense => filters.currencies.includes(expense.currency));
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(expense => 
        new Date(expense.date) <= new Date(filters.dateTo)
      );
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(expense => expense.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(expense => expense.amount <= parseFloat(filters.maxAmount));
    }

    // Boolean filters
    if (filters.hasReceipt !== null) {
      filtered = filtered.filter(expense => 
        filters.hasReceipt ? !!expense.receiptUrl : !expense.receiptUrl
      );
    }

    if (filters.isRecurring !== null) {
      filtered = filtered.filter(expense => expense.isRecurring === filters.isRecurring);
    }

    setFilteredExpenses(filtered);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expenseId);
              loadExpenses();
              setShowExpenseMenu(null);
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const enterSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedExpenses([]);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedExpenses([]);
  };

  const handleReceiptScanned = (imageUri: string, extractedData?: any) => {
    if (onAddExpense) {
      onAddExpense();
    }
  };

  const handleSaveFilter = (name: string, filterData: ExpenseFilters) => {
    setSavedFilters(prev => [...prev, { name, filters: filterData }]);
  };

  const handleLoadFilter = (filterData: ExpenseFilters) => {
    setFilters(filterData);
    setShowFilterModal(false);
  };

  const handleDeleteSavedFilter = (name: string) => {
    setSavedFilters(prev => prev.filter(f => f.name !== name));
  };

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== '' && value !== null
  );

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
    summaryText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
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
    actionButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickActions: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
    },
    quickActionButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickActionText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginTop: 8,
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    expenseItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    expenseItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    selectionCheckbox: {
      position: 'absolute',
      top: 16,
      left: 16,
      zIndex: 1,
    },
    expenseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
      marginLeft: isSelectionMode ? 40 : 0,
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
      marginBottom: 8,
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
    menuButton: {
      padding: 8,
      marginLeft: 8,
    },
    expenseFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: isSelectionMode ? 40 : 0,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flex: 1,
    },
    tag: {
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
      marginBottom: 4,
    },
    tagText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    badges: {
      flexDirection: 'row',
      gap: 8,
    },
    badge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    receiptBadge: {
      backgroundColor: colors.success + '20',
    },
    recurringBadge: {
      backgroundColor: colors.accent + '20',
    },
    badgeText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
    },
    receiptBadgeText: {
      color: colors.success,
    },
    recurringBadgeText: {
      color: colors.accent,
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
    menuModal: {
      position: 'absolute',
      top: 40,
      right: 0,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 8,
      minWidth: 150,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
    },
    menuItemText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginLeft: 12,
    },
    menuItemDelete: {
      color: colors.error,
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
    selectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    selectionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    selectionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
    },
  });

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Expenses</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your expenses...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bulk Actions Bar */}
      {isSelectionMode && (
        <BulkExpenseActions
          selectedExpenses={filteredExpenses.filter(e => selectedExpenses.includes(e.id))}
          onClearSelection={exitSelectionMode}
          onRefresh={loadExpenses}
        />
      )}

      <View style={styles.header}>
        <View style={styles.selectionHeader}>
          <View>
            <Text style={styles.title}>Expenses</Text>
            <Text style={styles.summaryText}>
              {filteredExpenses.length} expenses • ${totalExpenses.toFixed(2)} total
            </Text>
          </View>
          {!isSelectionMode && filteredExpenses.length > 0 && (
            <TouchableOpacity style={styles.selectionButton} onPress={enterSelectionMode}>
              <Text style={styles.selectionButtonText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search expenses..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, hasActiveFilters && styles.actionButtonActive]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={hasActiveFilters ? '#FFFFFF' : colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {!isSelectionMode && (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setShowTemplatesModal(true)}
            >
              <Template size={24} color={colors.secondary} />
              <Text style={styles.quickActionText}>Templates</Text>
            </TouchableOpacity>
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setShowReceiptScanner(true)}
              >
                <Camera size={24} color={colors.accent} />
                <Text style={styles.quickActionText}>Scan Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {searchQuery || hasActiveFilters 
                ? 'No expenses found matching your criteria' 
                : 'No expenses recorded yet. Add your first expense!'}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              style={[
                styles.expenseItem,
                selectedExpenses.includes(expense.id) && styles.expenseItemSelected
              ]}
              onPress={() => {
                if (isSelectionMode) {
                  toggleExpenseSelection(expense.id);
                }
              }}
              onLongPress={() => {
                if (!isSelectionMode) {
                  enterSelectionMode();
                  toggleExpenseSelection(expense.id);
                }
              }}
            >
              {isSelectionMode && (
                <TouchableOpacity 
                  style={styles.selectionCheckbox}
                  onPress={() => toggleExpenseSelection(expense.id)}
                >
                  {selectedExpenses.includes(expense.id) ? (
                    <CheckSquare size={24} color={colors.primary} />
                  ) : (
                    <Square size={24} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              )}

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
                    -${expense.amount} {expense.currency}
                  </Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                  {!isSelectionMode && (
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => setShowExpenseMenu(
                        showExpenseMenu === expense.id ? null : expense.id
                      )}
                    >
                      <MoreVertical size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  
                  {showExpenseMenu === expense.id && (
                    <View style={styles.menuModal}>
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => {
                          setSelectedExpense(expense);
                          setShowExpenseMenu(null);
                          // TODO: Open edit modal
                        }}
                      >
                        <Edit3 size={16} color={colors.text} />
                        <Text style={styles.menuItemText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                        <Text style={[styles.menuItemText, styles.menuItemDelete]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.expenseFooter}>
                <View style={styles.tagsContainer}>
                  {expense.tags?.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.badges}>
                  {expense.receiptUrl && (
                    <View style={[styles.badge, styles.receiptBadge]}>
                      <Text style={[styles.badgeText, styles.receiptBadgeText]}>Receipt</Text>
                    </View>
                  )}
                  {expense.isRecurring && (
                    <View style={[styles.badge, styles.recurringBadge]}>
                      <Text style={[styles.badgeText, styles.recurringBadgeText]}>
                        {expense.recurringType}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {!isSelectionMode && onAddExpense && (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.addButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: 'transparent' }]}
            onPress={onAddExpense}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onSaveFilter={handleSaveFilter}
        savedFilters={savedFilters}
        onLoadFilter={handleLoadFilter}
        onDeleteSavedFilter={handleDeleteSavedFilter}
      />

      {/* Expense Templates Modal */}
      <ExpenseTemplates
        visible={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectTemplate={(template) => {
          if (onAddExpense) {
            onAddExpense();
          }
        }}
      />

      {/* Receipt Scanner */}
      <ReceiptScanner
        visible={showReceiptScanner}
        onClose={() => setShowReceiptScanner(false)}
        onReceiptScanned={handleReceiptScanned}
      />
    </View>
  );
}