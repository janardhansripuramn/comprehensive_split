import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getBudgetAlerts, getSpendingInsights, markBudgetAlertAsRead, markInsightAsRead } from '@/services/firestore';
import { BudgetAlert, SpendingInsight } from '@/types';
import {
  Bell,
  AlertTriangle,
  TrendingUp,
  Brain,
  X,
  Check,
  Info,
  DollarSign,
} from 'lucide-react-native';

interface NotificationSystemProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSystem({ visible, onClose }: NotificationSystemProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadNotifications();
    }
  }, [visible, user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [alertsData, insightsData] = await Promise.all([
        getBudgetAlerts(user.uid),
        getSpendingInsights(user.uid)
      ]);
      
      setAlerts(alertsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await markBudgetAlertAsRead(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkInsightAsRead = async (insightId: string) => {
    try {
      await markInsightAsRead(insightId);
      setInsights(prev => prev.filter(insight => insight.id !== insightId));
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'threshold':
        return <AlertTriangle size={20} color={colors.warning} />;
      case 'exceeded':
        return <AlertTriangle size={20} color={colors.error} />;
      case 'rollover':
        return <Info size={20} color={colors.primary} />;
      default:
        return <Bell size={20} color={colors.textSecondary} />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp size={20} color={colors.primary} />;
      case 'anomaly':
        return <AlertTriangle size={20} color={colors.warning} />;
      case 'recommendation':
        return <Brain size={20} color={colors.accent} />;
      case 'achievement':
        return <Check size={20} color={colors.success} />;
      default:
        return <Info size={20} color={colors.textSecondary} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.primary;
      default:
        return colors.textSecondary;
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
      maxHeight: '80%',
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
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    notificationItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    alertItem: {
      borderLeftColor: colors.warning,
    },
    insightItem: {
      borderLeftColor: colors.primary,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    notificationInfo: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
    },
    notificationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    priorityText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      textTransform: 'uppercase',
    },
    timestamp: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Budget Alerts */}
            {alerts.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Budget Alerts</Text>
                {alerts.map((alert) => (
                  <View key={alert.id} style={[styles.notificationItem, styles.alertItem]}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          {getAlertIcon(alert.type)}
                          <Text style={[styles.notificationTitle, { marginLeft: 8, marginBottom: 0 }]}>
                            Budget Alert
                          </Text>
                        </View>
                        <Text style={styles.notificationMessage}>{alert.message}</Text>
                      </View>
                      <View style={styles.notificationActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleMarkAlertAsRead(alert.id)}
                        >
                          <Check size={16} color={colors.success} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.notificationFooter}>
                      <View style={[styles.priorityBadge, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.priorityText, { color: colors.warning }]}>
                          Alert
                        </Text>
                      </View>
                      <Text style={styles.timestamp}>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Spending Insights */}
            {insights.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Smart Insights</Text>
                {insights.map((insight) => (
                  <View key={insight.id} style={[styles.notificationItem, styles.insightItem]}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          {getInsightIcon(insight.type)}
                          <Text style={[styles.notificationTitle, { marginLeft: 8, marginBottom: 0 }]}>
                            {insight.title}
                          </Text>
                        </View>
                        <Text style={styles.notificationMessage}>{insight.description}</Text>
                      </View>
                      <View style={styles.notificationActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleMarkInsightAsRead(insight.id)}
                        >
                          <Check size={16} color={colors.success} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.notificationFooter}>
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
                      <Text style={styles.timestamp}>
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Empty State */}
            {alerts.length === 0 && insights.length === 0 && (
              <View style={styles.emptyState}>
                <Bell size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>
                  No notifications at the moment. We'll notify you about budget alerts and spending insights!
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}