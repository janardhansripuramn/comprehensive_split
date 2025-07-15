import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  getUserProfile,
} from '@/services/firestore';
import {
  UserPlus,
  Users,
  Check,
  X,
  Mail,
  Search,
} from 'lucide-react-native';

interface Friend {
  id: string;
  friendId: string;
  displayName?: string;
  email?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toEmail: string;
  fromUserName?: string;
  fromUserEmail?: string;
}

export default function FriendsList() {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsData = await getFriends(user.uid);
      
      // Get friend details
      const friendsWithDetails = await Promise.all(
        friendsData.map(async (friend) => {
          const friendProfile = await getUserProfile(friend.friendId);
          return {
            ...friend,
            displayName: friendProfile?.displayName,
            email: friendProfile?.email,
          };
        })
      );
      
      setFriends(friendsWithDetails);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user?.email) return;
    
    try {
      const requests = await getFriendRequests(user.email);
      
      // Get sender details
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const senderProfile = await getUserProfile(request.fromUserId);
          return {
            ...request,
            fromUserName: senderProfile?.displayName,
            fromUserEmail: senderProfile?.email,
          };
        })
      );
      
      setFriendRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!emailInput.trim() || !user) return;

    if (emailInput.toLowerCase() === user.email?.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    setLoading(true);
    try {
      await sendFriendRequest(user.uid, emailInput.trim().toLowerCase());
      Alert.alert('Success', 'Friend request sent!');
      setEmailInput('');
      setShowAddFriend(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!user) return;

    setLoading(true);
    try {
      await acceptFriendRequest(request.id, request.fromUserId, user.uid);
      Alert.alert('Success', 'Friend request accepted!');
      loadFriends();
      loadFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
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
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 24,
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
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
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
    requestCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
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
    requestName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    requestEmail: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    requestActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      borderRadius: 8,
      padding: 8,
    },
    acceptButton: {
      backgroundColor: colors.success,
    },
    rejectButton: {
      backgroundColor: colors.error,
    },
    friendCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    friendInfo: {
      flex: 1,
    },
    friendName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    friendEmail: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
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
      marginBottom: 24,
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
  });

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Manage your connections</Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddFriend(true)}
          >
            <UserPlus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Friend Requests</Text>
            {friendRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.fromUserName || 'Unknown User'}
                    </Text>
                    <Text style={styles.requestEmail}>
                      {request.fromUserEmail}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptRequest(request)}
                      disabled={loading}
                    >
                      <Check size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      disabled={loading}
                    >
                      <X size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Friends List */}
        <Text style={styles.sectionTitle}>
          Friends ({filteredFriends.length})
        </Text>
        
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No friends found matching your search' : 'No friends yet. Add some friends to get started!'}
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend) => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getUserInitials(friend.displayName, friend.email)}
                </Text>
              </View>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>
                  {friend.displayName || 'Unknown User'}
                </Text>
                <Text style={styles.friendEmail}>{friend.email}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddFriend}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddFriend(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Friend</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="Enter friend's email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddFriend(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSendFriendRequest}
                disabled={loading || !emailInput.trim()}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}