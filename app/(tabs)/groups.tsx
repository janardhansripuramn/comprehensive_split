import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getGroups, createGroup, getExpenses } from '@/services/firestore';
import { Group, Expense } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import DebtTracker from '@/components/DebtTracker';
import SocialFeed from '@/components/SocialFeed';
import PaymentRequests from '@/components/PaymentRequests';
import {
  Users,
  Plus,
  Settings,
  DollarSign,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  CreditCard,
  MessageCircle,
  Send,
} from 'lucide-react-native';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<{ [groupId: string]: Expense[] }>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDebtTracker, setShowDebtTracker] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showPaymentRequests, setShowPaymentRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

  const loadGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const groupsData = await getGroups(user.uid);
      setGroups(groupsData);
      
      // Load expenses for each group
      const expensesData: { [groupId: string]: Expense[] } = {};
      for (const group of groupsData) {
        const expenses = await getExpenses(user.uid, { groupId: group.id });
        expensesData[group.id] = expenses;
      }
      setGroupExpenses(expensesData);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !user) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim(),
        creatorId: user.uid,
        members: [user.uid],
      });

      Alert.alert('Success', 'Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const getGroupStats = (group: Group) => {
    const expenses = groupExpenses[group.id] || [];
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const recentActivity = expenses.length > 0 
      ? `Last expense: ${expenses[0]?.description || 'No expenses'}`
      : 'No recent activity';
    
    return {
      totalExpenses,
      recentActivity,
      expenseCount: expenses.length,
    };
  };

  const handleGroupPress = (group: Group) => {
    // Navigate to group details page
    router.push(`/groups/${group.id}`);
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
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    groupInfo: {
      flex: 1,
    },
    groupName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    groupDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    groupMembers: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    groupActivity: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    settingsButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    groupStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
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
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>Manage shared expenses with friends</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Text style={styles.subtitle}>Manage shared expenses with friends</Text>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowDebtTracker(true)}
          >
            <CreditCard size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Debt Tracker</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowSocialFeed(true)}
          >
            <MessageCircle size={24} color={colors.secondary} />
            <Text style={styles.quickActionText}>Activity Feed</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => setShowPaymentRequests(true)}
          >
            <Send size={24} color={colors.accent} />
            <Text style={styles.quickActionText}>Requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              No groups yet. Create your first group to start sharing expenses with friends!
            </Text>
          </View>
        ) : (
          groups.map((group) => {
            const stats = getGroupStats(group);
            return (
              <TouchableOpacity 
                key={group.id} 
                style={styles.groupCard}
                onPress={() => handleGroupPress(group)}
              >
                <View style={styles.groupHeader}>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.description && (
                      <Text style={styles.groupDescription}>{group.description}</Text>
                    )}
                    <Text style={styles.groupMembers}>
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.groupActivity}>{stats.recentActivity}</Text>
                  </View>
                  <TouchableOpacity style={styles.settingsButton}>
                    <Settings size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.groupStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>${stats.totalExpenses.toFixed(2)}</Text>
                    <Text style={styles.statLabel}>Total Expenses</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.expenseCount}</Text>
                    <Text style={styles.statLabel}>Transactions</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{group.members.length}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                  </View>
                </View>
              </TouchableOpacity>
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

      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={groupDescription}
                onChangeText={setGroupDescription}
                placeholder="Enter group description"
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
                onPress={handleCreateGroup}
                disabled={creating}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Social Features */}
      <DebtTracker
        visible={showDebtTracker}
        onClose={() => setShowDebtTracker(false)}
      />
      
      <SocialFeed
        visible={showSocialFeed}
        onClose={() => setShowSocialFeed(false)}
      />
      
      <PaymentRequests
        visible={showPaymentRequests}
        onClose={() => setShowPaymentRequests(false)}
      />
    </View>
  );
}