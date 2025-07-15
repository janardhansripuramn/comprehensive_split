import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getFriends, getSplits } from '@/services/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Send,
  Clock,
  CheckCircle,
  X,
  DollarSign,
  User,
  Calendar,
  MessageCircle,
  AlertCircle,
} from 'lucide-react-native';

interface PaymentRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message: string;
  status: 'pending' | 'paid' | 'declined';
  relatedSplitId?: string;
  createdAt: Date;
  dueDate?: Date;
  fromUserName: string;
  toUserName: string;
}

interface PaymentRequestsProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaymentRequests({ visible, onClose }: PaymentRequestsProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [sentRequests, setSentRequests] = useState<PaymentRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PaymentRequest[]>([]);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newRequest, setNewRequest] = useState({
    toUserId: '',
    amount: '',
    message: '',
    dueDate: '',
  });

  useEffect(() => {
    if (visible && user) {
      loadPaymentRequests();
      loadFriends();
    }
  }, [visible, user]);

  const loadPaymentRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // In a real app, you'd fetch payment requests from your backend
      // For now, we'll simulate some data based on splits
      const splits = await getSplits(user.uid);
      
      const mockSentRequests: PaymentRequest[] = [
        {
          id: '1',
          fromUserId: user.uid,
          toUserId: 'friend1',
          amount: 25.50,
          currency: 'USD',
          message: 'Dinner at Italian restaurant',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          fromUserName: 'You',
          toUserName: 'John Doe',
        },
        {
          id: '2',
          fromUserId: user.uid,
          toUserId: 'friend2',
          amount: 15.00,
          currency: 'USD',
          message: 'Coffee and snacks',
          status: 'paid',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          fromUserName: 'You',
          toUserName: 'Jane Smith',
        },
      ];

      const mockReceivedRequests: PaymentRequest[] = [
        {
          id: '3',
          fromUserId: 'friend3',
          toUserId: user.uid,
          amount: 30.00,
          currency: 'USD',
          message: 'Movie tickets',
          status: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          fromUserName: 'Mike Johnson',
          toUserName: 'You',
        },
      ];

      setSentRequests(mockSentRequests);
      setReceivedRequests(mockReceivedRequests);
    } catch (error) {
      console.error('Error loading payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsData = await getFriends(user.uid);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.toUserId || !newRequest.amount.trim() || !newRequest.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd send this to your backend
      const request: PaymentRequest = {
        id: Date.now().toString(),
        fromUserId: user!.uid,
        toUserId: newRequest.toUserId,
        amount: parseFloat(newRequest.amount),
        currency: 'USD',
        message: newRequest.message,
        status: 'pending',
        createdAt: new Date(),
        dueDate: newRequest.dueDate ? new Date(newRequest.dueDate) : undefined,
        fromUserName: 'You',
        toUserName: friends.find(f => f.friendId === newRequest.toUserId)?.displayName || 'Friend',
      };

      setSentRequests(prev => [request, ...prev]);
      
      setNewRequest({
        toUserId: '',
        amount: '',
        message: '',
        dueDate: '',
      });
      setShowCreateRequest(false);
      
      Alert.alert('Success', 'Payment request sent successfully!');
    } catch (error) {
      console.error('Error creating payment request:', error);
      Alert.alert('Error', 'Failed to send payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'paid' | 'declined') => {
    try {
      setReceivedRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: action } : req
        )
      );
      
      Alert.alert(
        'Success', 
        action === 'paid' ? 'Payment marked as completed' : 'Request declined'
      );
    } catch (error) {
      console.error('Error responding to request:', error);
      Alert.alert('Error', 'Failed to update request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'paid':
        return colors.success;
      case 'declined':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={colors.warning} />;
      case 'paid':
        return <CheckCircle size={16} color={colors.success} />;
      case 'declined':
        return <X size={16} color={colors.error} />;
      default:
        return <AlertCircle size={16} color={colors.textSecondary} />;
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
    headerButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    headerButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
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
      marginTop: 24,
    },
    requestItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
    },
    requestItemSent: {
      borderLeftColor: colors.primary,
    },
    requestItemReceived: {
      borderLeftColor: colors.secondary,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    requestInfo: {
      flex: 1,
    },
    requestUser: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    requestMessage: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    requestAmount: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
      marginBottom: 4,
    },
    requestStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    requestStatusText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    requestFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
    },
    requestDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    actionButtonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    actionButtonTextSecondary: {
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
    createRequestModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    createRequestContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    createRequestTitle: {
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
    friendSelector: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    friendOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    friendOptionLast: {
      borderBottomWidth: 0,
    },
    friendOptionSelected: {
      backgroundColor: colors.primary + '20',
    },
    friendName: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
    },
    createRequestButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    createRequestButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    createRequestButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    createRequestButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    createRequestButtonTextPrimary: {
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
              <Text style={styles.title}>Payment Requests</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowCreateRequest(true)}
                >
                  <Send size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {/* Received Requests */}
              <Text style={styles.sectionTitle}>Requests from Friends</Text>
              {receivedRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageCircle size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No payment requests received
                  </Text>
                </View>
              ) : (
                receivedRequests.map((request) => (
                  <View key={request.id} style={[styles.requestItem, styles.requestItemReceived]}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestUser}>{request.fromUserName}</Text>
                        <Text style={styles.requestMessage}>{request.message}</Text>
                      </View>
                      <View>
                        <Text style={styles.requestAmount}>
                          ${request.amount.toFixed(2)}
                        </Text>
                        <View style={[styles.requestStatus, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                          {getStatusIcon(request.status)}
                          <Text style={[styles.requestStatusText, { color: getStatusColor(request.status) }]}>
                            {request.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.requestFooter}>
                      <Text style={styles.requestDate}>
                        {request.createdAt.toLocaleDateString()}
                      </Text>
                      {request.status === 'pending' && (
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonSecondary]}
                            onPress={() => handleRespondToRequest(request.id, 'declined')}
                          >
                            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                              Decline
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleRespondToRequest(request.id, 'paid')}
                          >
                            <Text style={styles.actionButtonText}>Mark Paid</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}

              {/* Sent Requests */}
              <Text style={styles.sectionTitle}>Your Requests</Text>
              {sentRequests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Send size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No payment requests sent
                  </Text>
                </View>
              ) : (
                sentRequests.map((request) => (
                  <View key={request.id} style={[styles.requestItem, styles.requestItemSent]}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestUser}>To: {request.toUserName}</Text>
                        <Text style={styles.requestMessage}>{request.message}</Text>
                      </View>
                      <View>
                        <Text style={styles.requestAmount}>
                          ${request.amount.toFixed(2)}
                        </Text>
                        <View style={[styles.requestStatus, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                          {getStatusIcon(request.status)}
                          <Text style={[styles.requestStatusText, { color: getStatusColor(request.status) }]}>
                            {request.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.requestFooter}>
                      <Text style={styles.requestDate}>
                        Sent {request.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Request Modal */}
      <Modal
        visible={showCreateRequest}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateRequest(false)}
      >
        <View style={styles.createRequestModal}>
          <View style={styles.createRequestContent}>
            <Text style={styles.createRequestTitle}>Send Payment Request</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Friend</Text>
              <View style={styles.friendSelector}>
                {friends.map((friend, index) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendOption,
                      index === friends.length - 1 && styles.friendOptionLast,
                      newRequest.toUserId === friend.friendId && styles.friendOptionSelected,
                    ]}
                    onPress={() => setNewRequest(prev => ({ ...prev, toUserId: friend.friendId }))}
                  >
                    <Text style={styles.friendName}>
                      {friend.displayName || friend.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                value={newRequest.amount}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newRequest.message}
                onChangeText={(text) => setNewRequest(prev => ({ ...prev, message: text }))}
                placeholder="What is this payment for?"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.createRequestButtons}>
              <TouchableOpacity
                style={styles.createRequestButton}
                onPress={() => setShowCreateRequest(false)}
              >
                <Text style={styles.createRequestButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createRequestButton, styles.createRequestButtonPrimary]}
                onPress={handleCreateRequest}
                disabled={loading}
              >
                <Text style={[styles.createRequestButtonText, styles.createRequestButtonTextPrimary]}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}