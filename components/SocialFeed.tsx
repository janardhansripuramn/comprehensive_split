import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getExpenses, getSplits, getGroups } from '@/services/firestore';
import { Expense, Split, Group } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  DollarSign,
  Calendar,
  MessageCircle,
  Heart,
  Share,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react-native';

interface ActivityItem {
  id: string;
  type: 'expense_added' | 'expense_split' | 'payment_made' | 'group_created' | 'member_joined';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  groupName?: string;
  participants?: string[];
  metadata?: any;
}

interface SocialFeedProps {
  visible: boolean;
  onClose: () => void;
}

export default function SocialFeed({ visible, onClose }: SocialFeedProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  useEffect(() => {
    if (visible && user) {
      loadActivityFeed();
    }
  }, [visible, user]);

  const loadActivityFeed = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [expenses, splits, groups] = await Promise.all([
        getExpenses(user.uid, { limit: 50 }),
        getSplits(user.uid),
        getGroups(user.uid)
      ]);

      const activityItems: ActivityItem[] = [];

      // Process expenses
      expenses.forEach(expense => {
        if (expense.groupId) {
          const group = groups.find(g => g.id === expense.groupId);
          activityItems.push({
            id: `expense_${expense.id}`,
            type: 'expense_added',
            title: 'Added group expense',
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            userName: expense.userId === user.uid ? 'You' : 'Friend',
            timestamp: expense.createdAt,
            groupName: group?.name,
          });
        }
      });

      // Process splits
      splits.forEach(split => {
        const group = groups.find(g => g.id === split.groupId);
        const participantCount = split.participants.length;
        
        activityItems.push({
          id: `split_${split.id}`,
          type: 'expense_split',
          title: 'Split expense',
          description: `Split among ${participantCount} people`,
          amount: split.participants.reduce((sum, p) => sum + p.amount, 0),
          currency: 'USD', // Default currency
          userName: split.creatorId === user.uid ? 'You' : 'Friend',
          timestamp: split.createdAt,
          groupName: group?.name,
          participants: split.participants.map(p => p.userId === user.uid ? 'You' : 'Friend'),
        });
      });

      // Process group activities
      groups.forEach(group => {
        activityItems.push({
          id: `group_${group.id}`,
          type: 'group_created',
          title: 'Created group',
          description: group.name,
          userName: group.creatorId === user.uid ? 'You' : 'Friend',
          timestamp: group.createdAt,
          groupName: group.name,
          participants: group.members.map(m => m === user.uid ? 'You' : 'Friend'),
        });
      });

      // Sort by timestamp (newest first)
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(activityItems.slice(0, 20)); // Limit to 20 most recent
    } catch (error) {
      console.error('Error loading activity feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivityFeed();
    setRefreshing(false);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'expense_added':
        return <DollarSign size={20} color={colors.primary} />;
      case 'expense_split':
        return <Users size={20} color={colors.secondary} />;
      case 'payment_made':
        return <CheckCircle size={20} color={colors.success} />;
      case 'group_created':
        return <Users size={20} color={colors.accent} />;
      case 'member_joined':
        return <User size={20} color={colors.warning} />;
      default:
        return <Clock size={20} color={colors.textSecondary} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'expense_added':
        return colors.primary;
      case 'expense_split':
        return colors.secondary;
      case 'payment_made':
        return colors.success;
      case 'group_created':
        return colors.accent;
      case 'member_joined':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
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
      flex: 1,
      paddingHorizontal: 24,
    },
    activityItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    activityHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    activityDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    activityMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activityAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    activityTime: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    activityGroup: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.accent,
      marginTop: 4,
    },
    activityParticipants: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    participantChip: {
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
      marginBottom: 4,
    },
    participantText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    activityActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginLeft: 4,
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
    detailModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    detailContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    detailTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    detailInfo: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    detailAmount: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 8,
    },
    detailDescription: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    detailGroup: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.accent,
      textAlign: 'center',
    },
    detailCloseButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    detailCloseButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
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
              <Text style={styles.title}>Activity Feed</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollContainer} 
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {activities.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No recent activity. Start adding expenses and splitting with friends to see updates here!
                  </Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={[
                      styles.activityItem,
                      { borderLeftColor: getActivityColor(activity.type) }
                    ]}
                    onPress={() => setSelectedActivity(activity)}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.activityIcon}>
                        {getActivityIcon(activity.type)}
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {activity.userName} {activity.title}
                        </Text>
                        <Text style={styles.activityDescription}>
                          {activity.description}
                        </Text>
                        
                        <View style={styles.activityMeta}>
                          {activity.amount && (
                            <Text style={styles.activityAmount}>
                              ${activity.amount.toFixed(2)} {activity.currency}
                            </Text>
                          )}
                          <Text style={styles.activityTime}>
                            {formatTimeAgo(activity.timestamp)}
                          </Text>
                        </View>
                        
                        {activity.groupName && (
                          <Text style={styles.activityGroup}>
                            in {activity.groupName}
                          </Text>
                        )}
                        
                        {activity.participants && activity.participants.length > 0 && (
                          <View style={styles.activityParticipants}>
                            {activity.participants.slice(0, 3).map((participant, index) => (
                              <View key={index} style={styles.participantChip}>
                                <Text style={styles.participantText}>{participant}</Text>
                              </View>
                            ))}
                            {activity.participants.length > 3 && (
                              <View style={styles.participantChip}>
                                <Text style={styles.participantText}>
                                  +{activity.participants.length - 3} more
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.activityActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Heart size={16} color={colors.textSecondary} />
                        <Text style={styles.actionButtonText}>Like</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <MessageCircle size={16} color={colors.textSecondary} />
                        <Text style={styles.actionButtonText}>Comment</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Share size={16} color={colors.textSecondary} />
                        <Text style={styles.actionButtonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Activity Detail Modal */}
      <Modal
        visible={!!selectedActivity}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedActivity(null)}
      >
        <View style={styles.detailModal}>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>Activity Details</Text>
            
            {selectedActivity && (
              <View style={styles.detailInfo}>
                {selectedActivity.amount && (
                  <Text style={styles.detailAmount}>
                    ${selectedActivity.amount.toFixed(2)} {selectedActivity.currency}
                  </Text>
                )}
                <Text style={styles.detailDescription}>
                  {selectedActivity.description}
                </Text>
                {selectedActivity.groupName && (
                  <Text style={styles.detailGroup}>
                    Group: {selectedActivity.groupName}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={() => setSelectedActivity(null)}
            >
              <Text style={styles.detailCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}