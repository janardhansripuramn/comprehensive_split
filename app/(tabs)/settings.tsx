import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { signOut, updatePassword, deleteUser } from '@firebase/auth';
import { auth } from '@/config/firebase';
import { getUserProfile, createUserProfile } from '@/services/firestore';
import { User, CURRENCIES } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import DataExport from '@/components/DataExport';
import NotificationSystem from '@/components/NotificationSystem';
import {
  Settings,
  User as UserIcon,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  LogOut,
  X,
  Check,
  AlertTriangle,
  HelpCircle,
  Mail,
  Phone,
  CreditCard,
  Smartphone,
} from 'lucide-react-native';

interface UserSettings {
  notifications: {
    budgetAlerts: boolean;
    expenseReminders: boolean;
    friendRequests: boolean;
    groupActivity: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    expenseVisibility: 'public' | 'friends' | 'private';
    allowFriendRequests: boolean;
    shareAnalytics: boolean;
  };
  preferences: {
    defaultCurrency: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    numberFormat: 'US' | 'EU' | 'IN';
    theme: 'auto' | 'light' | 'dark';
    language: string;
  };
}

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      budgetAlerts: true,
      expenseReminders: true,
      friendRequests: true,
      groupActivity: true,
      weeklyReports: false,
      monthlyReports: true,
      pushNotifications: true,
      emailNotifications: true,
    },
    privacy: {
      profileVisibility: 'friends',
      expenseVisibility: 'private',
      allowFriendRequests: true,
      shareAnalytics: false,
    },
    preferences: {
      defaultCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'US',
      theme: 'auto',
      language: 'en',
    },
  });

  const [showDataExport, setShowDataExport] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
        setProfileForm({
          displayName: profile.displayName || '',
          email: profile.email || '',
          phone: profile.phone || '',
        });
        setSettings(prev => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            defaultCurrency: profile.defaultCurrency || 'USD',
          }
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateNotificationSetting = (key: keyof UserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      }
    }));
  };

  const updatePrivacySetting = (key: keyof UserSettings['privacy'], value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      }
    }));
  };

  const updatePreference = (key: keyof UserSettings['preferences'], value: any) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      }
    }));
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, passwordForm.newPassword);
        Alert.alert('Success', 'Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordModal(false);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              if (user) {
                await deleteUser(user);
                router.replace('/auth');
              }
            } catch (error: any) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileForm.displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    setLoading(true);
    try {
      await createUserProfile(user.uid, {
        displayName: profileForm.displayName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        defaultCurrency: settings.preferences.defaultCurrency,
      });
      
      Alert.alert('Success', 'Profile updated successfully');
      setShowProfileModal(false);
      loadUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupData = async () => {
    Alert.alert(
      'Backup Data',
      'Your data will be exported and can be saved to your device or cloud storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => setShowDataExport(true),
        },
      ]
    );
  };

  const handleRestoreData = async () => {
    Alert.alert(
      'Restore Data',
      'This feature allows you to restore data from a previous backup. This will replace your current data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Implement data restore functionality
            Alert.alert('Coming Soon', 'Data restore functionality will be available in a future update.');
          },
        },
      ]
    );
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
    profileCard: {
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
    },
    profileName: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: '#FFFFFF',
      opacity: 0.8,
      marginBottom: 16,
    },
    editProfileButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    editProfileText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    scrollContainer: {
      flex: 1,
      paddingHorizontal: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    settingItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      marginRight: 16,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    settingValue: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    dangerItem: {
      borderColor: colors.error + '40',
      backgroundColor: colors.error + '10',
    },
    dangerText: {
      color: colors.error,
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
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      height: 48,
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    eyeButton: {
      padding: 4,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
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
    modalButtonDanger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
    },
    modalButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    modalButtonTextPrimary: {
      color: '#FFFFFF',
    },
    currencyGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    currencyItem: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: '30%',
      alignItems: 'center',
    },
    currencyItemSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    currencyCode: {
      fontSize: 14,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 2,
    },
    currencyCodeSelected: {
      color: '#FFFFFF',
    },
    currencyName: {
      fontSize: 10,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    currencyNameSelected: {
      color: '#FFFFFF',
      opacity: 0.8,
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
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>

        {/* Profile Card */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getUserInitials(userProfile?.displayName, user?.email)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingIcon}>
              <Lock size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Change Password</Text>
              <Text style={styles.settingDescription}>Update your account password</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowCurrencyModal(true)}
          >
            <View style={styles.settingIcon}>
              <CreditCard size={20} color={colors.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Default Currency</Text>
              <Text style={styles.settingDescription}>
                Currently: {settings.preferences.defaultCurrency}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Bell size={20} color={colors.warning} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Budget Alerts</Text>
              <Text style={styles.settingDescription}>Get notified when approaching budget limits</Text>
            </View>
            <Switch
              value={settings.notifications.budgetAlerts}
              onValueChange={(value) => updateNotificationSetting('budgetAlerts', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.notifications.budgetAlerts ? '#FFFFFF' : colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Smartphone size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive notifications on your device</Text>
            </View>
            <Switch
              value={settings.notifications.pushNotifications}
              onValueChange={(value) => updateNotificationSetting('pushNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.notifications.pushNotifications ? '#FFFFFF' : colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Mail size={20} color={colors.success} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive weekly and monthly reports</Text>
            </View>
            <Switch
              value={settings.notifications.emailNotifications}
              onValueChange={(value) => updateNotificationSetting('emailNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.notifications.emailNotifications ? '#FFFFFF' : colors.textSecondary}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowNotifications(true)}
          >
            <View style={styles.settingIcon}>
              <Bell size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>View Notifications</Text>
              <Text style={styles.settingDescription}>See all your notifications</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Allow Friend Requests</Text>
              <Text style={styles.settingDescription}>Let others send you friend requests</Text>
            </View>
            <Switch
              value={settings.privacy.allowFriendRequests}
              onValueChange={(value) => updatePrivacySetting('allowFriendRequests', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.privacy.allowFriendRequests ? '#FFFFFF' : colors.textSecondary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Database size={20} color={colors.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Share Analytics</Text>
              <Text style={styles.settingDescription}>Help improve the app with anonymous usage data</Text>
            </View>
            <Switch
              value={settings.privacy.shareAnalytics}
              onValueChange={(value) => updatePrivacySetting('shareAnalytics', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={settings.privacy.shareAnalytics ? '#FFFFFF' : colors.textSecondary}
            />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
            <View style={styles.settingIcon}>
              {isDark ? (
                <Moon size={20} color={colors.accent} />
              ) : (
                <Sun size={20} color={colors.warning} />
              )}
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Theme</Text>
              <Text style={styles.settingDescription}>
                Currently: {isDark ? 'Dark' : 'Light'} mode
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleBackupData}
          >
            <View style={styles.settingIcon}>
              <Download size={20} color={colors.success} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your data as CSV, PDF, or JSON</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleRestoreData}
          >
            <View style={styles.settingIcon}>
              <Upload size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Restore Data</Text>
              <Text style={styles.settingDescription}>Import data from a backup file</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <HelpCircle size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & FAQ</Text>
              <Text style={styles.settingDescription}>Get help and find answers</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <Mail size={20} color={colors.secondary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Contact Support</Text>
              <Text style={styles.settingDescription}>Get in touch with our team</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingIcon}>
              <LogOut size={20} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Sign Out</Text>
              <Text style={styles.settingDescription}>Sign out of your account</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={() => setShowDeleteModal(true)}
          >
            <View style={styles.settingIcon}>
              <Trash2 size={20} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
              <Text style={styles.settingDescription}>Permanently delete your account and data</Text>
            </View>
            <ChevronRight size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Data Export Modal */}
      <DataExport
        visible={showDataExport}
        onClose={() => setShowDataExport(false)}
      />

      {/* Notifications Modal */}
      <NotificationSystem
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPasswords.current}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.newPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPasswords.new}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.confirmPassword}
                  onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showPasswords.confirm}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Default Currency</Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.currencyGrid}>
                {CURRENCIES.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyItem,
                      settings.preferences.defaultCurrency === currency.code && styles.currencyItemSelected,
                    ]}
                    onPress={() => updatePreference('defaultCurrency', currency.code)}
                  >
                    <Text
                      style={[
                        styles.currencyCode,
                        settings.preferences.defaultCurrency === currency.code && styles.currencyCodeSelected,
                      ]}
                    >
                      {currency.code}
                    </Text>
                    <Text
                      style={[
                        styles.currencyName,
                        settings.preferences.defaultCurrency === currency.code && styles.currencyNameSelected,
                      ]}
                    >
                      {currency.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCurrencyModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setShowCurrencyModal(false);
                  if (user) {
                    createUserProfile(user.uid, {
                      defaultCurrency: settings.preferences.defaultCurrency,
                    });
                  }
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal
        visible={showProfileModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={profileForm.displayName}
                  onChangeText={(text) => setProfileForm(prev => ({ ...prev, displayName: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={profileForm.email}
                  onChangeText={(text) => setProfileForm(prev => ({ ...prev, email: text }))}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={profileForm.phone}
                  onChangeText={(text) => setProfileForm(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <AlertTriangle size={48} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={[styles.settingDescription, { textAlign: 'center', marginBottom: 20 }]}>
              This action cannot be undone. All your data including expenses, budgets, groups, and friends will be permanently deleted.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleDeleteAccount}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}