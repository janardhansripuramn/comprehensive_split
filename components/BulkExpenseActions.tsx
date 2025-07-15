import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Expense } from '@/types';
import { deleteExpense, updateExpense } from '@/services/firestore';
import {
  Trash2,
  Edit3,
  Tag,
  Copy,
  X,
  Check,
} from 'lucide-react-native';

interface BulkExpenseActionsProps {
  selectedExpenses: Expense[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export default function BulkExpenseActions({
  selectedExpenses,
  onClearSelection,
  onRefresh,
}: BulkExpenseActionsProps) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBulkDelete = async () => {
    Alert.alert(
      'Delete Expenses',
      `Are you sure you want to delete ${selectedExpenses.length} expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await Promise.all(
                selectedExpenses.map(expense => deleteExpense(expense.id))
              );
              onClearSelection();
              onRefresh();
              Alert.alert('Success', 'Expenses deleted successfully');
            } catch (error) {
              console.error('Error deleting expenses:', error);
              Alert.alert('Error', 'Failed to delete expenses');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkCategoryUpdate = async (category: string) => {
    setLoading(true);
    try {
      await Promise.all(
        selectedExpenses.map(expense =>
          updateExpense(expense.id, { category })
        )
      );
      onClearSelection();
      onRefresh();
      Alert.alert('Success', 'Categories updated successfully');
    } catch (error) {
      console.error('Error updating categories:', error);
      Alert.alert('Error', 'Failed to update categories');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectionText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 12,
    },
    totalText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      opacity: 0.9,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 8,
      padding: 8,
    },
    closeButton: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      width: '80%',
      maxWidth: 300,
    },
    modalTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    actionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.surface,
    },
    actionText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginLeft: 12,
    },
  });

  if (selectedExpenses.length === 0) return null;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Check size={20} color="#FFFFFF" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.selectionText}>
              {selectedExpenses.length} selected
            </Text>
            <Text style={styles.totalText}>
              Total: ${totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowActions(true)}
            disabled={loading}
          >
            <Edit3 size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleBulkDelete}
            disabled={loading}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClearSelection}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showActions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bulk Actions</Text>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                handleBulkCategoryUpdate('Food & Dining');
              }}
            >
              <Tag size={20} color={colors.primary} />
              <Text style={styles.actionText}>Set Category: Food & Dining</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                handleBulkCategoryUpdate('Transportation');
              }}
            >
              <Tag size={20} color={colors.secondary} />
              <Text style={styles.actionText}>Set Category: Transportation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                handleBulkCategoryUpdate('Shopping');
              }}
            >
              <Tag size={20} color={colors.accent} />
              <Text style={styles.actionText}>Set Category: Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}