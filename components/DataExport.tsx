import React, { useState } from 'react';
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
import { generateExportData } from '@/services/firestore';
import { ExportData } from '@/types';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  X,
  Check,
  Mail,
  Share,
} from 'lucide-react-native';

interface DataExportProps {
  visible: boolean;
  onClose: () => void;
}

export default function DataExport({ visible, onClose }: DataExportProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [exportFormat, setExportFormat] = useState('csv');
  const [loading, setLoading] = useState(false);

  const periods = [
    { value: 'this-month', label: 'This Month', days: 30 },
    { value: 'last-month', label: 'Last Month', days: 30 },
    { value: 'last-3-months', label: 'Last 3 Months', days: 90 },
    { value: 'this-year', label: 'This Year', days: 365 },
    { value: 'all-time', label: 'All Time', days: 9999 },
  ];

  const formats = [
    { value: 'csv', label: 'CSV File', icon: FileText, description: 'Spreadsheet compatible' },
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Formatted report' },
    { value: 'json', label: 'JSON Data', icon: FileText, description: 'Raw data format' },
  ];

  const getDateRange = (period: string) => {
    const now = new Date();
    let from: Date;
    let to: Date = now;

    switch (period) {
      case 'this-month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last-month':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last-3-months':
        from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'this-year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all-time':
        from = new Date(2020, 0, 1); // Reasonable start date
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { from, to };
  };

  const generateCSV = (data: ExportData): string => {
    let csv = 'Type,Description,Amount,Currency,Category,Date,Notes\n';
    
    // Add expenses
    data.expenses.forEach(expense => {
      csv += `Expense,"${expense.description}",${expense.amount},${expense.currency},"${expense.category}",${expense.date.toISOString().split('T')[0]},"${expense.notes || ''}"\n`;
    });
    
    // Add income
    data.income.forEach(income => {
      csv += `Income,"${income.source}",${income.amount},${income.currency},"${income.category || 'Income'}",${income.date.toISOString().split('T')[0]},"${income.notes || ''}"\n`;
    });
    
    return csv;
  };

  const generatePDF = (data: ExportData): string => {
    // In a real app, you'd use a PDF generation library
    // For now, return formatted text that could be converted to PDF
    let content = `EXPENSE REPORT\n`;
    content += `Period: ${data.dateRange.from.toLocaleDateString()} - ${data.dateRange.to.toLocaleDateString()}\n\n`;
    
    content += `SUMMARY\n`;
    content += `Total Expenses: $${data.summary.totalExpenses.toFixed(2)}\n`;
    content += `Total Income: $${data.summary.totalIncome.toFixed(2)}\n`;
    content += `Net Savings: $${data.summary.netSavings.toFixed(2)}\n\n`;
    
    content += `TOP CATEGORIES\n`;
    data.summary.topCategories.forEach(cat => {
      content += `${cat.category}: $${cat.amount.toFixed(2)}\n`;
    });
    
    return content;
  };

  const handleExport = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { from, to } = getDateRange(selectedPeriod);
      const exportData = await generateExportData(user.uid, from, to);
      
      let content: string;
      let filename: string;
      
      switch (exportFormat) {
        case 'csv':
          content = generateCSV(exportData);
          filename = `expenses_${selectedPeriod}.csv`;
          break;
        case 'pdf':
          content = generatePDF(exportData);
          filename = `expenses_${selectedPeriod}.pdf`;
          break;
        case 'json':
          content = JSON.stringify(exportData, null, 2);
          filename = `expenses_${selectedPeriod}.json`;
          break;
        default:
          content = generateCSV(exportData);
          filename = `expenses_${selectedPeriod}.csv`;
      }

      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Mobile sharing
        Alert.alert('Export Ready', 'Your data has been prepared for export.');
      }

      Alert.alert('Success', 'Data exported successfully!');
      onClose();
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
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
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
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
      maxHeight: 400,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    optionContainer: {
      marginBottom: 24,
    },
    optionItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    optionIcon: {
      marginRight: 12,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    optionDescription: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    checkIcon: {
      marginLeft: 8,
    },
    exportButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 16,
    },
    exportButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: '#FFFFFF',
    },
    previewContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewTitle: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    previewText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
  });

  const selectedPeriodData = periods.find(p => p.value === selectedPeriod);
  const selectedFormatData = formats.find(f => f.value === exportFormat);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Export Data</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {/* Time Period Selection */}
            <View style={styles.optionContainer}>
              <Text style={styles.sectionTitle}>Select Time Period</Text>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.optionItem,
                    selectedPeriod === period.value && styles.optionItemSelected,
                  ]}
                  onPress={() => setSelectedPeriod(period.value)}
                >
                  <View style={styles.optionIcon}>
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{period.label}</Text>
                  </View>
                  {selectedPeriod === period.value && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Format Selection */}
            <View style={styles.optionContainer}>
              <Text style={styles.sectionTitle}>Export Format</Text>
              {formats.map((format) => (
                <TouchableOpacity
                  key={format.value}
                  style={[
                    styles.optionItem,
                    exportFormat === format.value && styles.optionItemSelected,
                  ]}
                  onPress={() => setExportFormat(format.value)}
                >
                  <View style={styles.optionIcon}>
                    <format.icon size={20} color={colors.primary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{format.label}</Text>
                    <Text style={styles.optionDescription}>{format.description}</Text>
                  </View>
                  {exportFormat === format.value && (
                    <View style={styles.checkIcon}>
                      <Check size={20} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Export Preview</Text>
              <Text style={styles.previewText}>
                Period: {selectedPeriodData?.label}{'\n'}
                Format: {selectedFormatData?.label}{'\n'}
                Includes: Expenses, Income, Categories, Notes
              </Text>
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              disabled={loading}
            >
              <Text style={styles.exportButtonText}>
                {loading ? 'Exporting...' : 'Export Data'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}