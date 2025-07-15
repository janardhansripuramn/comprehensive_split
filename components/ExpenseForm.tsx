import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { addExpense } from '@/services/firestore';
import { EXPENSE_CATEGORIES, CURRENCIES } from '@/types';
import {
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Camera,
  Image as ImageIcon,
  X,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface ExpenseFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupId?: string;
  initialData?: {
    description?: string;
    amount?: number;
    category?: string;
  };
}

export default function ExpenseForm({ 
  visible, 
  onClose, 
  onSuccess, 
  groupId,
  initialData 
}: ExpenseFormProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    amount: initialData?.amount?.toString() || '',
    category: initialData?.category || EXPENSE_CATEGORIES[0],
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: [] as string[],
    isRecurring: false,
    recurringType: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.amount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) return;

    setLoading(true);
    try {
      await addExpense({
        userId: user.uid,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        currency: formData.currency,
        date: new Date(formData.date),
        notes: formData.notes.trim(),
        tags: formData.tags,
        isRecurring: formData.isRecurring,
        recurringType: formData.isRecurring ? formData.recurringType : undefined,
        groupId: groupId,
        receiptUrl: receiptUri,
      });

      Alert.alert('Success', 'Expense added successfully!');
      onSuccess();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: EXPENSE_CATEGORIES[0],
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      tags: [],
      isRecurring: false,
      recurringType: 'monthly',
    });
    setReceiptUri(null);
    setTagInput('');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Camera features are not available on web');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Camera features are not available on web');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
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
    inputContainer: {
      marginBottom: 20,
    },
    label: {
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
    pickerButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    tag: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: '#FFFFFF',
      marginRight: 4,
    },
    tagInput: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    tagInputField: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    addTagButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
    },
    receiptSection: {
      marginBottom: 20,
    },
    receiptButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    receiptButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    receiptButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginTop: 4,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
    },
    submitButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    pickerModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    pickerContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      width: '80%',
      maxHeight: '70%',
    },
    pickerTitle: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    pickerItem: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    pickerItemText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    selectedPickerItem: {
      backgroundColor: colors.primary,
    },
    selectedPickerItemText: {
      color: '#FFFFFF',
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
            <Text style={styles.title}>
              {groupId ? 'Add Group Expense' : 'Add Expense'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter expense description"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Amount */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Category */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.pickerText}>{formData.category}</Text>
                <Tag size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Currency */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Currency</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={styles.pickerText}>{formData.currency}</Text>
                <DollarSign size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Add notes..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            {/* Tags */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInput}>
                <TextInput
                  style={styles.tagInputField}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add tag"
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <Check size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Receipt */}
            {Platform.OS !== 'web' && (
              <View style={styles.receiptSection}>
                <Text style={styles.label}>Receipt</Text>
                <View style={styles.receiptButtons}>
                  <TouchableOpacity style={styles.receiptButton} onPress={takePhoto}>
                    <Camera size={24} color={colors.primary} />
                    <Text style={styles.receiptButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.receiptButton} onPress={pickImage}>
                    <ImageIcon size={24} color={colors.secondary} />
                    <Text style={styles.receiptButtonText}>Choose Image</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Adding...' : 'Add Expense'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            <ScrollView>
              {EXPENSE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.pickerItem,
                    formData.category === category && styles.selectedPickerItem,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, category }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.category === category && styles.selectedPickerItemText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Select Currency</Text>
            <ScrollView>
              {CURRENCIES.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.pickerItem,
                    formData.currency === currency.code && styles.selectedPickerItem,
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, currency: currency.code }));
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      formData.currency === currency.code && styles.selectedPickerItemText,
                    ]}
                  >
                    {currency.code} - {currency.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}