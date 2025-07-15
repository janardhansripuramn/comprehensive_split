import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getExpenseTemplates, saveExpenseTemplate, deleteExpenseTemplate } from '@/services/firestore';
import { ExpenseTemplate } from '@/types';
import {
  Plus,
  Template,
  Trash2,
  X,
  Save,
} from 'lucide-react-native';

interface ExpenseTemplatesProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ExpenseTemplate) => void;
}

export default function ExpenseTemplates({
  visible,
  onClose,
  onSelectTemplate,
}: ExpenseTemplatesProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<ExpenseTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'Food & Dining',
    currency: 'USD',
  });

  useEffect(() => {
    if (visible && user) {
      loadTemplates();
    }
  }, [visible, user]);

  const loadTemplates = async () => {
    if (!user) return;
    
    try {
      const data = await getExpenseTemplates(user.uid);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.description.trim() || !user) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await saveExpenseTemplate({
        userId: user.uid,
        name: newTemplate.name.trim(),
        description: newTemplate.description.trim(),
        amount: parseFloat(newTemplate.amount) || 0,
        category: newTemplate.category,
        currency: newTemplate.currency,
      });

      setNewTemplate({
        name: '',
        description: '',
        amount: '',
        category: 'Food & Dining',
        currency: 'USD',
      });
      setShowCreateModal(false);
      loadTemplates();
      Alert.alert('Success', 'Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      Alert.alert('Error', 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpenseTemplate(templateId);
              loadTemplates();
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
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
      padding: 24,
    },
    templateItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    templateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    templateInfo: {
      flex: 1,
    },
    templateName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    templateDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    templateDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    templateAmount: {
      fontSize: 16,
      fontFamily: 'Inter-Bold',
      color: colors.primary,
    },
    templateCategory: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    deleteButton: {
      backgroundColor: colors.error + '20',
      borderRadius: 8,
      padding: 8,
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
    createModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    createModalContent: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    createModalTitle: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 24,
      textAlign: 'center',
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
              <Text style={styles.title}>Expense Templates</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {templates.length === 0 ? (
                <View style={styles.emptyState}>
                  <Template size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>
                    No templates yet. Create your first template to quickly add recurring expenses!
                  </Text>
                </View>
              ) : (
                templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => {
                      onSelectTemplate(template);
                      onClose();
                    }}
                  >
                    <View style={styles.templateHeader}>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{template.name}</Text>
                        <Text style={styles.templateDescription}>
                          {template.description}
                        </Text>
                        <View style={styles.templateDetails}>
                          <Text style={styles.templateAmount}>
                            ${template.amount} {template.currency}
                          </Text>
                          <Text style={styles.templateCategory}>
                            {template.category}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        visible={showCreateModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.createModalOverlay}>
          <View style={styles.createModalContent}>
            <Text style={styles.createModalTitle}>Create Template</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Template Name *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.name}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Morning Coffee"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.description}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, description: text }))}
                placeholder="e.g., Daily coffee at Starbucks"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.amount}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={newTemplate.category}
                onChangeText={(text) => setNewTemplate(prev => ({ ...prev, category: text }))}
                placeholder="Food & Dining"
                placeholderTextColor={colors.textSecondary}
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
                onPress={handleCreateTemplate}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  {loading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}