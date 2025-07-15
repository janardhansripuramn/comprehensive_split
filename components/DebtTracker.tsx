import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getSplits, getGroups, getFriends } from '@/services/firestore';
import { Split, Group } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
} from 'lucide-react-native';

interface DebtSummary {
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  type: 'owes_you' | 'you_owe';
  transactions: {
    id: string;
    description: string;
    amount: number;
    date: Date;
    groupName?: string;
  }[];
}

interface DebtTrackerProps {
  visible: boolean;
  onClose: () => void;
}

export default function DebtTracker({ visible, onClose }: DebtTrackerProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtSummary | null>(null);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadDebtData();
    }
  }, [visible, user]);

  const loadDebtData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [splits, groups, friends] = await Promise.all([
        getSplits(user.uid),
        getGroups(user.uid),
        getFriends(user.uid)
      ]);

      const debtMap: { [userId: string]: DebtSummary } = {};

      // Process splits to calculate debts
      splits.forEach(split => {
        split.participants.forEach(participant => {
          if (participant.userId === user.uid) return;

          const isCreator = split.creatorId === user.uid;
          const amount = participant.amount;
          const settled = participant.settled;

          if (!settled) {
            if (!debtMap[participant.userId]) {
              const friend = friends.find(f => f.friendId === participant.userId);
              debtMap[participant.userId] = {
                userId: participant.userId,
                userName: friend?.displayName || 'Unknown User',
                userEmail: friend?.email || '',
                amount: 0,
                type: isCreator ? 'owes_you' : 'you_owe',
                transactions: []
              };
            }

            const group = groups.find(g => g.id === split.groupId);
            debtMap[participant.userId].transactions.push({
              id: split.id,
              description: `Split expense`,
              amount: amount,
              date: split.createdAt,
              groupName: group?.name
            });

            if (isCreator) {
              debtMap[participant.userId].amount += amount;
              debtMap[participant.userId].type = 'owes_you';
            } else {
              debtMap[participant.userId].amount += amount;
              debtMap[participant.userId].type = 'you_owe';
            }
          }
        });
      });

      setDebts(Object.values(debtMap).filter(debt => Math.abs(debt.amount) > 0.01));
    } catch (error) {
      console.error('Error loading debt data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentRequest = async () => {
    if (!selectedDebt || !paymentMessage.trim()) {
      Alert.alert('Error', 'Please enter a message for the payment request');
      return;
    }

    try {
      // In a real app, this would send a notification or email
      Alert.alert(
        'Payment Request Sent',
        `Payment request sent to ${selectedDebt.userName} for $${selectedDebt.amount.toFixed(2)}`
      );
      
      setPaymentMessage('');
      setShowPaymentRequest(false);
      setSelectedDebt(null);
    } catch (error) {
      console.error('Error sending payment request:', error);
      Alert.alert('Error', 'Failed to send payment request');
    }
  };

  const totalOwedToYou = debts
    .filter(debt => debt.type === 'owes_you')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const totalYouOwe = debts
    .filter(debt => debt.type === 'you_owe')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const netBalance = totalOwedToYou - totalYouOwe;

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
    closeButton: {
      padding: 8,
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
    debtItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    debtItemOwesYou: {
      borderLeftColor: colors.success,
    },
    debtItemYouOwe: {
      borderLeftColor: colors.error,
    },
    debtHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    debtInfo: {
      flex: 1,
    },
    debtName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    debtEmail: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    debtAmount: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    debtAmountOwesYou: {
      color: colors.success,
    },
    debtAmountYouOwe: {
      color: colors.error,
    },
    debtType: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    debtActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
    transactionsList: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 2,
    },
    transactionGroup: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    transactionAmount: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
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
    paymentRequestModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    paymentRequestContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    paymentRequestTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    paymentRequestInfo: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    paymentRequestAmount: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    paymentRequestUser: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      textAlign: 'center',
    },
    messageInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      height: 100,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    paymentRequestButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    paymentRequestButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentRequestButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    paymentRequestButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    paymentRequestButtonTextPrimary: {
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
              <Text style={styles.title}>Debt Tracker</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
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
                  <Text style={styles.summaryValue}>${totalOwedToYou.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>Owed to You</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>${totalYouOwe.toFixed(2)}</Text>
                  <Text style={styles.summaryLabel}>You Owe</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    ${Math.abs(netBalance).toFixed(2)}
                  </Text>
                  <Text style={styles.summaryLabel}>
                    Net {netBalance >= 0 ? 'Credit' : 'Debt'}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {debts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No outstanding debts. All your shared expenses are settled!
                  </Text>
                </View>
              ) : (
                <>
                  {/* People who owe you */}
                  {debts.filter(debt => debt.type === 'owes_you').length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>People Who Owe You</Text>
                      {debts
                        .filter(debt => debt.type === 'owes_you')
                        .map((debt) => (
                          <View key={debt.userId} style={[styles.debtItem, styles.debtItemOwesYou]}>
                            <View style={styles.debtHeader}>
                              <View style={styles.debtInfo}>
                                <Text style={styles.debtName}>{debt.userName}</Text>
                                <Text style={styles.debtEmail}>{debt.userEmail}</Text>
                                <Text style={styles.debtType}>
                                  {debt.transactions.length} transaction{debt.transactions.length !== 1 ? 's' : ''}
                                </Text>
                              </View>
                              <View>
                                <Text style={[styles.debtAmount, styles.debtAmountOwesYou]}>
                                  ${debt.amount.toFixed(2)}
                                </Text>
                                <View style={styles.debtActions}>
                                  <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => {
                                      setSelectedDebt(debt);
                                      setShowPaymentRequest(true);
                                    }}
                                  >
                                    <Send size={12} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Request</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                            
                            <View style={styles.transactionsList}>
                              {debt.transactions.map((transaction, index) => (
                                <View key={index} style={styles.transactionItem}>
                                  <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionDescription}>
                                      {transaction.description}
                                    </Text>
                                    {transaction.groupName && (
                                      <Text style={styles.transactionGroup}>
                                        {transaction.groupName}
                                      </Text>
                                    )}
                                  </View>
                                  <Text style={styles.transactionAmount}>
                                    ${transaction.amount.toFixed(2)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                    </>
                  )}

                  {/* People you owe */}
                  {debts.filter(debt => debt.type === 'you_owe').length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>People You Owe</Text>
                      {debts
                        .filter(debt => debt.type === 'you_owe')
                        .map((debt) => (
                          <View key={debt.userId} style={[styles.debtItem, styles.debtItemYouOwe]}>
                            <View style={styles.debtHeader}>
                              <View style={styles.debtInfo}>
                                <Text style={styles.debtName}>{debt.userName}</Text>
                                <Text style={styles.debtEmail}>{debt.userEmail}</Text>
                                <Text style={styles.debtType}>
                                  {debt.transactions.length} transaction{debt.transactions.length !== 1 ? 's' : ''}
                                </Text>
                              </View>
                              <View>
                                <Text style={[styles.debtAmount, styles.debtAmountYouOwe]}>
                                  ${debt.amount.toFixed(2)}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.transactionsList}>
                              {debt.transactions.map((transaction, index) => (
                                <View key={index} style={styles.transactionItem}>
                                  <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionDescription}>
                                      {transaction.description}
                                    </Text>
                                    {transaction.groupName && (
                                      <Text style={styles.transactionGroup}>
                                        {transaction.groupName}
                                      </Text>
                                    )}
                                  </View>
                                  <Text style={styles.transactionAmount}>
                                    ${transaction.amount.toFixed(2)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Request Modal */}
      <Modal
        visible={showPaymentRequest}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPaymentRequest(false)}
      >
        <View style={styles.paymentRequestModal}>
          <View style={styles.paymentRequestContent}>
            <Text style={styles.paymentRequestTitle}>Send Payment Request</Text>
            
            {selectedDebt && (
              <View style={styles.paymentRequestInfo}>
                <Text style={styles.paymentRequestAmount}>
                  ${selectedDebt.amount.toFixed(2)}
                </Text>
                <Text style={styles.paymentRequestUser}>
                  to {selectedDebt.userName}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.messageInput}
              value={paymentMessage}
              onChangeText={setPaymentMessage}
              placeholder="Add a message (optional)..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <View style={styles.paymentRequestButtons}>
              <TouchableOpacity
                style={styles.paymentRequestButton}
                onPress={() => setShowPaymentRequest(false)}
              >
                <Text style={styles.paymentRequestButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentRequestButton, styles.paymentRequestButtonPrimary]}
                onPress={handleSendPaymentRequest}
              >
                <Text style={[styles.paymentRequestButtonText, styles.paymentRequestButtonTextPrimary]}>
                  Send Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}