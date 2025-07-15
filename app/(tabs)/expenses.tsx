import React, { useState } from 'react';
import { View } from 'react-native';
import EnhancedExpensesList from '@/components/EnhancedExpensesList';
import ExpenseForm from '@/components/ExpenseForm';

export default function ExpensesScreen() {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <EnhancedExpensesList 
        key={refreshKey}
        onAddExpense={() => setShowExpenseForm(true)}
      />
      
      <ExpenseForm
        visible={showExpenseForm}
        onClose={() => setShowExpenseForm(false)}
        onSuccess={handleExpenseAdded}
      />
    </View>
  );
}