import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getFriends, createSplit } from '@/services/firestore';
import { Expense } from '@/types';
import {
  X,
  Users,
  DollarSign,
  Percent,
  Calculator,
  Check,
  User,
} from 'lucide-react-native';

interface Friend {
  id: string;
  friendId: string;
  displayName?: string;
  email?: string;
}

interface SplitExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess: () => void;
}

type SplitMethod = 'equal' | 'amount' | 'percentage';

interface Participant {
  userId: string;
  name: string;
  email: string;
  amount: number;
  percentage: number;
  selected: boolean;
}

export default function SplitExpenseModal({ 
  visible, 
  onClose, 
  expense, 
  onSuccess 
}: SplitExpenseModalProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadFriends();
    }
  }, [visible, user]);

  useEffect(() => {
    if (expense && friends.length > 0) {
      initializeParticipants();
    }
  }, [expense, friends]);

  useEffect(() => {
    if (splitMethod === 'equal') {
      calculateEqualSplit();
    }
  }, [splitMethod, participants.filter(p => p.selected).length]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsData = await getFriends(user.uid);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const initializeParticipants = () => {
    if (!expense || !user) return;

    const participantsList: Participant[] = [
      {
        userId: user.uid,
        name: user.displayName || 'You',
        email: user.email || '',
        amount: 0,
        percentage: 0,
        selected: true,
      },
      ...friends.map(friend => ({
        userId: friend.friendId,
        name: friend.displayName || friend.email || 'Unknown',
        email: friend.email || '',
        amount: 0,
        percentage: 0,
        selected: false,
      })),
    ];

    setParticipants(participantsList);
  };

  const calculateEqualSplit = () => {
    if (!expense) return;

    const selectedParticipants = participants.filter(p => p.selected);
    const splitAmount = expense.amount / selectedParticipants.length;

    setParticipants(prev => prev.map(p => ({
      ...p,
      amount: p.selected ? splitAmount : 0,
      percentage: p.selected ? (100 / selectedParticipants.length) : 0,
    })));
  };

  const toggleParticipant = (userId: string) => {
    if (userId === user?.uid) return; // Can't deselect yourself

    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, selected: !p.selected } : p
    ));
  };

  const updateParticipantAmount = (userId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, amount: numAmount } : p
    ));
  };

  const updateParticipantPercentage = (userId: string, percentage: string) => {
    const numPercentage = parseFloat(percentage) || 0;
    if (!expense) return;

    const amount = (expense.amount * numPercentage) / 100;
    setParticipants(prev => prev.map(p => 
      p.userId === userId ? { ...p, percentage: numPercentage, amount } : p
    ));
  };

  const validateSplit = (): boolean => {
    if (!expense) return false;

    const selectedParticipants = participants.filter(p => p.selected);
    if (selectedParticipants.length < 2) {
      Alert.alert('Error', 'Please select at least one other person to split with');
      return false;
    }

    const totalAmount = selectedParticipants.reduce((sum, p) => sum + p.amount, 0);
    const tolerance = 0.01; // Allow 1 cent difference due to rounding

    if (Math.abs(totalAmount - expense.amount) > tolerance) {
      Alert.alert('Error', `Split amounts must total ${expense.amount} ${expense.currency}`);
      return false;
    }

    if (splitMethod === 'percentage') {
      const totalPercentage = selectedParticipants.reduce((sum, p) => sum + p.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.1) {
        Alert.alert('Error', 'Percentages must total 100%');
        return false;
      }
    }

    return true;
  };

  const handleCreateSplit = async () => {
    if (!expense || !user || !validateSplit()) return;

    setLoading(true);
    try {
      const selectedParticipants = participants.filter(p => p.selected);
      
      await createSplit({
        expenseId: expense.id,
        creatorId: user.uid,
        participants: selectedParticipants.map(p => ({
          userId: p.userId,
          amount: p.amount,
          paid: p.userId === user.uid, // Creator has already paid
          settled: false,
        })),
        type: splitMethod,
        groupId: expense.groupId,
      });

      Alert.alert('Success', 'Expense split created successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating split:', error);
      Alert.alert('Error', 'Failed to create split. Please try again.');
    } finally {
      setLoading(false);
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
    closeButton: {
      padding: 8,
    },
    scrollContainer: {
      padding: 24,
    },
    expenseInfo: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expenseDescription: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    expenseAmount: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    splitMethodContainer: {
      flexDirection: 'row',
      marginBottom: 24,
      gap: 8,
    },
    splitMethodButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    splitMethodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    splitMethodIcon: {
      marginBottom: 8,
    },
    splitMethodText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    splitMethodTextActive: {
      color: '#FFFFFF',
    },
    participantItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    participantItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    participantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    participantAvatarText: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    participantEmail: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    participantInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    inputContainer: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 4,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summary: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginVertical: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    summaryTotal: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
      marginTop: 8,
    },
    summaryTotalLabel: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    summaryTotalValue: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    createButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
  });

  if (!expense) return null;

  const selectedParticipants = participants.filter(p => p.selected);
  const totalAmount = selectedParticipants.reduce((sum, p) => sum + p.amount, 0);
  const totalPercentage = selectedParticipants.reduce((sum, p) => sum + p.percentage, 0);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Split Expense</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Expense Info */}
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDescription}>{expense.description}</Text>
              <Text style={styles.expenseAmount}>
                ${expense.amount} {expense.currency}
              </Text>
            </View>

            {/* Split Method */}
            <Text style={styles.sectionTitle}>Split Method</Text>
            <View style={styles.splitMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.splitMethodButton,
                  splitMethod === 'equal' && styles.splitMethodButtonActive,
                ]}
                onPress={() => setSplitMethod('equal')}
              >
                <View style={styles.splitMethodIcon}>
                  <Users size={20} color={splitMethod === 'equal' ? '#FFFFFF' : colors.text} />
                </View>
                <Text
                  style={[
                    styles.splitMethodText,
                    splitMethod === 'equal' && styles.splitMethodTextActive,
                  ]}
                >
                  Equally
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitMethodButton,
                  splitMethod === 'amount' && styles.splitMethodButtonActive,
                ]}
                onPress={() => setSplitMethod('amount')}
              >
                <View style={styles.splitMethodIcon}>
                  <DollarSign size={20} color={splitMethod === 'amount' ? '#FFFFFF' : colors.text} />
                </View>
                <Text
                  style={[
                    styles.splitMethodText,
                    splitMethod === 'amount' && styles.splitMethodTextActive,
                  ]}
                >
                  By Amount
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitMethodButton,
                  splitMethod === 'percentage' && styles.splitMethodButtonActive,
                ]}
                onPress={() => setSplitMethod('percentage')}
              >
                <View style={styles.splitMethodIcon}>
                  <Percent size={20} color={splitMethod === 'percentage' ? '#FFFFFF' : colors.text} />
                </View>
                <Text
                  style={[
                    styles.splitMethodText,
                    splitMethod === 'percentage' && styles.splitMethodTextActive,
                  ]}
                >
                  By Percentage
                </Text>
              </TouchableOpacity>
            </View>

            {/* Participants */}
            <Text style={styles.sectionTitle}>Select Participants</Text>
            {participants.map((participant) => (
              <TouchableOpacity
                key={participant.userId}
                style={[
                  styles.participantItem,
                  participant.selected && styles.participantItemSelected,
                ]}
                onPress={() => toggleParticipant(participant.userId)}
                disabled={participant.userId === user?.uid}
              >
                <View style={styles.participantHeader}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>
                      {getUserInitials(participant.name)}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantEmail}>{participant.email}</Text>
                  </View>
                  {participant.selected && (
                    <Check size={20} color={colors.primary} />
                  )}
                </View>

                {participant.selected && splitMethod !== 'equal' && (
                  <View style={styles.participantInputs}>
                    {splitMethod === 'amount' && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Amount</Text>
                        <TextInput
                          style={styles.input}
                          value={participant.amount.toString()}
                          onChangeText={(text) => updateParticipantAmount(participant.userId, text)}
                          placeholder="0.00"
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                    {splitMethod === 'percentage' && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Percentage</Text>
                        <TextInput
                          style={styles.input}
                          value={participant.percentage.toString()}
                          onChangeText={(text) => updateParticipantPercentage(participant.userId, text)}
                          placeholder="0"
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Summary */}
            <View style={styles.summary}>
              <Text style={styles.sectionTitle}>Summary</Text>
              {selectedParticipants.map((participant) => (
                <View key={participant.userId} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{participant.name}</Text>
                  <Text style={styles.summaryValue}>
                    ${participant.amount.toFixed(2)}
                    {splitMethod === 'percentage' && ` (${participant.percentage.toFixed(1)}%)`}
                  </Text>
                </View>
              ))}
              <View style={[styles.summaryRow, styles.summaryTotal]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  ${totalAmount.toFixed(2)}
                  {splitMethod === 'percentage' && ` (${totalPercentage.toFixed(1)}%)`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateSplit}
              disabled={loading || selectedParticipants.length < 2}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating Split...' : 'Create Split'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}