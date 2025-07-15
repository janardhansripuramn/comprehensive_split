import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  DollarSign,
  Target,
  Users,
  Bell,
  Shield,
  Sparkles,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: (userData: any) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function OnboardingFlow({ visible, onComplete }: OnboardingFlowProps) {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    displayName: '',
    defaultCurrency: 'USD',
    monthlyBudget: '',
    categories: ['Food & Dining', 'Transportation', 'Shopping'],
    notifications: true,
  });

  const updateUserData = (key: string, value: any) => {
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ExpenseFlow',
      subtitle: 'Your smart expense tracking companion',
      icon: <Sparkles size={48} color={colors.primary} />,
      content: (
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>
            Take control of your finances with intelligent expense tracking, 
            budgeting, and insights that help you make better financial decisions.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={styles.featureText}>Track expenses effortlessly</Text>
            </View>
            <View style={styles.featureItem}>
              <Target size={20} color={colors.secondary} />
              <Text style={styles.featureText}>Set and monitor budgets</Text>
            </View>
            <View style={styles.featureItem}>
              <Users size={20} color={colors.accent} />
              <Text style={styles.featureText}>Split expenses with friends</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      subtitle: 'Tell us a bit about yourself',
      icon: <Shield size={48} color={colors.secondary} />,
      content: (
        <View style={styles.formContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={userData.displayName}
              onChangeText={(text) => updateUserData('displayName', text)}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Default Currency</Text>
            <View style={styles.currencySelector}>
              {['USD', 'EUR', 'GBP', 'JPY'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.currencyButton,
                    userData.defaultCurrency === currency && styles.currencyButtonSelected,
                  ]}
                  onPress={() => updateUserData('defaultCurrency', currency)}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      userData.defaultCurrency === currency && styles.currencyTextSelected,
                    ]}
                  >
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ),
    },
    {
      id: 'budget',
      title: 'Set Your Budget',
      subtitle: 'Help us understand your spending goals',
      icon: <Target size={48} color={colors.accent} />,
      content: (
        <View style={styles.formContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Monthly Budget (Optional)</Text>
            <TextInput
              style={styles.input}
              value={userData.monthlyBudget}
              onChangeText={(text) => updateUserData('monthlyBudget', text)}
              placeholder="Enter your monthly budget"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <Text style={styles.inputHint}>
              This helps us provide better insights and alerts
            </Text>
          </View>
        </View>
      ),
    },
    {
      id: 'notifications',
      title: 'Stay Informed',
      subtitle: 'Get notified about important updates',
      icon: <Bell size={48} color={colors.warning} />,
      content: (
        <View style={styles.formContent}>
          <View style={styles.notificationOption}>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>Budget Alerts</Text>
              <Text style={styles.notificationDescription}>
                Get notified when you're approaching your budget limits
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                userData.notifications && styles.toggleButtonActive,
              ]}
              onPress={() => updateUserData('notifications', !userData.notifications)}
            >
              {userData.notifications && <Check size={16} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      subtitle: 'Start tracking your expenses',
      icon: <Check size={48} color={colors.success} />,
      content: (
        <View style={styles.completeContent}>
          <Text style={styles.completeText}>
            Your ExpenseFlow account is ready! You can now start tracking expenses, 
            setting budgets, and gaining insights into your spending habits.
          </Text>
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Next steps:</Text>
            <Text style={styles.nextStepItem}>• Add your first expense</Text>
            <Text style={styles.nextStepItem}>• Set up budget categories</Text>
            <Text style={styles.nextStepItem}>• Invite friends to split expenses</Text>
          </View>
        </View>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete(userData);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingTop: 60,
    },
    progressBar: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    progressStep: {
      flex: 1,
      height: 4,
      backgroundColor: colors.border,
      marginHorizontal: 2,
      borderRadius: 2,
    },
    progressStepActive: {
      backgroundColor: colors.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    stepHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    stepIcon: {
      marginBottom: 16,
    },
    stepTitle: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    stepSubtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    stepContent: {
      flex: 1,
      justifyContent: 'center',
    },
    welcomeContent: {
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    featureList: {
      width: '100%',
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    featureText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginLeft: 16,
    },
    formContent: {
      width: '100%',
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
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
    inputHint: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 8,
    },
    currencySelector: {
      flexDirection: 'row',
      gap: 12,
    },
    currencyButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    currencyText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    currencyTextSelected: {
      color: '#FFFFFF',
    },
    notificationOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
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
    notificationDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    toggleButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
    },
    completeContent: {
      alignItems: 'center',
    },
    completeText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 32,
    },
    nextSteps: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    nextStepsTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
    },
    nextStepItem: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    navigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24,
      paddingBottom: 40,
    },
    navButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    navButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    navButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    navButtonTextPrimary: {
      color: '#FFFFFF',
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    skipButtonText: {
      color: colors.textSecondary,
    },
  });

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressStep,
                  index <= currentStep && styles.progressStepActive,
                ]}
              />
            ))}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                {currentStepData.icon}
              </View>
              <Text style={styles.stepTitle}>{currentStepData.title}</Text>
              <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
            </View>

            <View style={styles.stepContent}>
              {currentStepData.content}
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            {!isFirstStep ? (
              <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                <ArrowLeft size={20} color={colors.text} />
                <Text style={[styles.navButtonText, { marginLeft: 8 }]}>Back</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.navButton, styles.skipButton]}>
                <Text style={[styles.navButtonText, styles.skipButtonText]}>Skip</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary]}
              onPress={handleNext}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextPrimary]}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}