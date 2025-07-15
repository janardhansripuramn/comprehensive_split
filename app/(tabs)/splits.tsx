import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getSplits, getExpenses, updateSplit } from '@/services/firestore';
import { Split, Expense } from '@/types';
import SplitExpenseModal from '@/components/SplitExpenseModal';
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  User,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SplitWithExpense extends Split {
  expense?: Expense;
}

export default function SplitsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [splits, setSplits] = useState<SplitWithExpense[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [splitsData, expensesData] = await Promise.all([
        getSplits(user.uid),
        getExpenses(user.uid, { limit: 50 }),
      ]);

      // Filter expenses that are not in groups and not already split
      const availableExpenses = expensesData.filter(expense => 
        !expense.groupId && !splitsData.some(split => split.expenseId === expense.id)
      );

      // Attach expense data to splits
      const splitsWithExpenses = splitsData.map(split => ({
        ...split,
        expense: expensesData.find(expense => expense.id === split.expenseId),
      }));

      setSplits(splitsWithExpenses);
      setExpenses(availableExpenses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (splitId: string, participantUserId: string) => {
    try {
      const split = splits.find(s => s.id === splitId);
      if (!split) return;

      const updatedParticipants = split.participants.map(p =>
        p.userId === participantUserId ? { ...p, paid: true } : p
      );

      await updateSplit(splitId, { participants: updatedParticipants });
      loadData();
    } catch (error) {
      console.error('Error updating split:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const handleMarkAsSettled = async (splitId: string, participantUserId: string) => {
    try {
      const split = splits.find(s => s.id === splitId);
      if (!split) return;

      const updatedParticipants = split.participants.map(p =>
        p.userId === participantUserId ? { ...p, settled: true } : p
      );

      await updateSplit(splitId, { participants: updatedParticipants });
      loadData();
    } catch (error) {
      console.error('Error updating split:', error);
      Alert.alert('Error', 'Failed to update settlement status');
    }
  };

  const calculateBalances = () => {
    const balances: { [userId: string]: { name: string; amount: number } } = {};

    splits.forEach(split => {
      split.participants.forEach(participant => {
        if (!balances[participant.userId]) {
          balances[participant.userId] = { name: 'Unknown', amount: 0 };
        }

        if (participant.userId === user?.uid) {
          // You paid for others
          const othersOwed = split.participants
            .filter(p => p.userId !== user.uid && !p.settled)
            .reduce((sum, p) => sum + p.amount, 0);
          balances[participant.userId].amount += othersOwed;
        } else if (split.creatorId === user?.uid && !participant.settled) {
          // Others owe you
          balances[participant.userId].amount -= participant.amount;
        }
      });
    });

    return Object.entries(balances)
      .filter(([userId, balance]) => userId !== user?.uid && Math.abs(balance.amount) > 0.01)
      .map(([userId, balance]) => ({ userId, ...balance }));
  };

  const balances = calculateBalances();
  const totalOwedToYou = balances.filter(b => b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);
  const totalYouOwe = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);

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
    balanceItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    balanceLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    balanceIcon: {
      marginRight: 12,
    },
    balanceInfo: {
      flex: 1,
    },
    balanceName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    balanceStatus: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    balanceAmount: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
    },
    positiveBalance: {
      color: colors.success,
    },
    negativeBalance: {
      color: colors.error,
    },
    splitCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    splitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    splitInfo: {
      flex: 1,
    },
    splitDescription: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    splitAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: 8,
    },
    splitMethod: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    splitStatus: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginBottom: 8,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
    completedBadge: {
      backgroundColor: colors.success + '20',
    },
    completedText: {
      color: colors.success,
    },
    pendingBadge: {
      backgroundColor: colors.warning + '20',
    },
    pendingText: {
      color: colors.warning,
    },
    participantsList: {
      marginTop: 8,
    },
    participantItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    participantAmount: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginRight: 12,
    },
    participantActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
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
    expenseItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expenseDescription: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    expenseAmount: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
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
        <Text style={styles.title}>Splits</Text>
        <Text style={styles.subtitle}>Manage shared expenses</Text>

        {/* Summary Card */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalOwedToYou.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>Owed to You</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>${totalYouOwe.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>You Owe</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                ${(totalOwedToYou - totalYouOwe).toFixed(2)}
              </Text>
              <Text style={styles.summaryLabel}>Net Balance</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Balances */}
        {balances.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Balances</Text>
            {balances.map((balance) => (
              <View key={balance.userId} style={styles.balanceItem}>
                <View style={styles.balanceLeft}>
                  <View style={styles.balanceIcon}>
                    {balance.amount > 0 ? (
                      <ArrowUpRight size={20} color={colors.error} />
                    ) : (
                      <ArrowDownLeft size={20} color={colors.success} />
                    )}
                  </View>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceName}>{balance.name}</Text>
                    <Text style={styles.balanceStatus}>
                      {balance.amount > 0 ? 'You owe' : 'Owes you'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.balanceAmount,
                    balance.amount > 0 ? styles.negativeBalance : styles.positiveBalance,
                  ]}
                >
                  ${Math.abs(balance.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Recent Splits */}
        <Text style={styles.sectionTitle}>Recent Splits</Text>
        {splits.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No splits yet. Create your first split to share expenses with friends!
            </Text>
          </View>
        ) : (
          splits.map((split) => {
            const isCompleted = split.participants.every(p => p.paid && p.settled);
            const pendingCount = split.participants.filter(p => !p.paid || !p.settled).length;

            return (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitHeader}>
                  <View style={styles.splitInfo}>
                    <Text style={styles.splitDescription}>
                      {split.expense?.description || 'Unknown Expense'}
                    </Text>
                    <Text style={styles.splitAmount}>
                      ${split.participants.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                    </Text>
                    <Text style={styles.splitMethod}>
                      Split {split.type} • {split.participants.length} people
                    </Text>
                  </View>
                  <View style={styles.splitStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.completedBadge : styles.pendingBadge,
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle size={12} color={colors.success} />
                      ) : (
                        <Clock size={12} color={colors.warning} />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          isCompleted ? styles.completedText : styles.pendingText,
                        ]}
                      >
                        {isCompleted ? 'Completed' : `${pendingCount} pending`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.participantsList}>
                  {split.participants.map((participant) => (
                    <View key={participant.userId} style={styles.participantItem}>
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>
                          {participant.userId === user?.uid ? 'You' : 'Friend'}
                        </Text>
                      </View>
                      <Text style={styles.participantAmount}>
                        ${participant.amount.toFixed(2)}
                      </Text>
                      {split.creatorId === user?.uid && participant.userId !== user?.uid && (
                        <View style={styles.participantActions}>
                          {!participant.paid && (
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleMarkAsPaid(split.id, participant.userId)}
                            >
                              <Text style={styles.actionButtonText}>Mark Paid</Text>
                            </TouchableOpacity>
                          )}
                          {participant.paid && !participant.settled && (
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleMarkAsSettled(split.id, participant.userId)}
                            >
                              <Text style={styles.actionButtonText}>Settle</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
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
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Create Split Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Expense to Split</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {expenses.length === 0 ? (
                <View style={styles.emptyState}>
                  <DollarSign size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No expenses available to split. Add some expenses first!
                  </Text>
                </View>
              ) : (
                expenses.map((expense) => (
                  <TouchableOpacity
                    key={expense.id}
                    style={styles.expenseItem}
                    onPress={() => {
                      setSelectedExpense(expense);
                      setShowCreateModal(false);
                    }}
                  >
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseAmount}>
                      ${expense.amount} {expense.currency}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Split Expense Modal */}
      <SplitExpenseModal
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onSuccess={() => {
          loadData();
          setSelectedExpense(null);
        }}
      />
    </View>
  );
}