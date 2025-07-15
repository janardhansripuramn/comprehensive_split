import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Repeat,
} from 'lucide-react-native';

export default function RemindersScreen() {
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNotes, setReminderNotes] = useState('');

  const reminders = [
    {
      id: '1',
      title: 'Pay rent',
      notes: 'Monthly rent payment',
      dueDate: '2024-01-31',
      status: 'overdue',
      recurring: 'monthly',
    },
    {
      id: '2',
      title: 'Electric bill',
      notes: 'Utility payment',
      dueDate: '2024-01-20',
      status: 'due-today',
      recurring: 'monthly',
    },
    {
      id: '3',
      title: 'Insurance payment',
      notes: 'Car insurance premium',
      dueDate: '2024-01-25',
      status: 'upcoming',
      recurring: 'yearly',
    },
    {
      id: '4',
      title: 'Netflix subscription',
      notes: 'Monthly subscription',
      dueDate: '2024-01-15',
      status: 'completed',
      recurring: 'monthly',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return colors.error;
      case 'due-today':
        return colors.warning;
      case 'upcoming':
        return colors.primary;
      case 'completed':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertCircle size={20} color={colors.error} />;
      case 'due-today':
        return <Clock size={20} color={colors.warning} />;
      case 'upcoming':
        return <Calendar size={20} color={colors.primary} />;
      case 'completed':
        return <CheckCircle size={20} color={colors.success} />;
      default:
        return <Bell size={20} color={colors.textSecondary} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Overdue';
      case 'due-today':
        return 'Due Today';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return '';
    }
  };

  const groupedReminders = {
    overdue: reminders.filter(r => r.status === 'overdue'),
    dueToday: reminders.filter(r => r.status === 'due-today'),
    upcoming: reminders.filter(r => r.status === 'upcoming'),
    completed: reminders.filter(r => r.status === 'completed'),
  };

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
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    reminderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    reminderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    reminderInfo: {
      flex: 1,
    },
    reminderTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    reminderNotes: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    reminderDate: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
    },
    statusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 6,
    },
    reminderFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    recurringBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    recurringText: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    actionButtonText: {
      fontSize: 12,
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
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
  });

  const handleCreateReminder = () => {
    if (reminderTitle.trim()) {
      // Handle reminder creation logic here
      setReminderTitle('');
      setReminderNotes('');
      setShowCreateModal(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <Text style={styles.subtitle}>Never miss a payment again</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {groupedReminders.overdue.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Overdue</Text>
            {groupedReminders.overdue.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[styles.reminderCard, { borderLeftColor: colors.error }]}
              >
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderNotes}>{reminder.notes}</Text>
                    <Text style={styles.reminderDate}>{reminder.dueDate}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(reminder.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(reminder.status) }]}>
                      {getStatusText(reminder.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderFooter}>
                  <View style={styles.recurringBadge}>
                    <Repeat size={12} color={colors.textSecondary} />
                    <Text style={styles.recurringText}>{reminder.recurring}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {groupedReminders.dueToday.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Due Today</Text>
            {groupedReminders.dueToday.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[styles.reminderCard, { borderLeftColor: colors.warning }]}
              >
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderNotes}>{reminder.notes}</Text>
                    <Text style={styles.reminderDate}>{reminder.dueDate}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(reminder.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(reminder.status) }]}>
                      {getStatusText(reminder.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderFooter}>
                  <View style={styles.recurringBadge}>
                    <Repeat size={12} color={colors.textSecondary} />
                    <Text style={styles.recurringText}>{reminder.recurring}</Text>
                  </View>
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Mark Paid</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {groupedReminders.upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            {groupedReminders.upcoming.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[styles.reminderCard, { borderLeftColor: colors.primary }]}
              >
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderNotes}>{reminder.notes}</Text>
                    <Text style={styles.reminderDate}>{reminder.dueDate}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(reminder.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(reminder.status) }]}>
                      {getStatusText(reminder.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderFooter}>
                  <View style={styles.recurringBadge}>
                    <Repeat size={12} color={colors.textSecondary} />
                    <Text style={styles.recurringText}>{reminder.recurring}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {groupedReminders.completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {groupedReminders.completed.map((reminder) => (
              <TouchableOpacity
                key={reminder.id}
                style={[styles.reminderCard, { borderLeftColor: colors.success, opacity: 0.7 }]}
              >
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderInfo}>
                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderNotes}>{reminder.notes}</Text>
                    <Text style={styles.reminderDate}>{reminder.dueDate}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    {getStatusIcon(reminder.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(reminder.status) }]}>
                      {getStatusText(reminder.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderFooter}>
                  <View style={styles.recurringBadge}>
                    <Repeat size={12} color={colors.textSecondary} />
                    <Text style={styles.recurringText}>{reminder.recurring}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
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

      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Reminder</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder="Enter reminder title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reminderNotes}
                onChangeText={setReminderNotes}
                placeholder="Add notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateReminder}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}