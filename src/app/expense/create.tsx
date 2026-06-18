import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Modal, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { expenseRepo } from '../../repositories/expenseRepo';
import { Category, ExpenseType } from '../../types';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export default function CreateExpenseScreen() {
  const router = useRouter();
  const { theme, currency, selectedStoreId } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Toggle Type
  const [type, setType] = useState<ExpenseType>('expense'); // expense = cash out, income = cash in

  // Form states
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [exDate, setExDate] = useState<string>(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Categories loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fetchCategories = async () => {
    if (!selectedStoreId) return;
    try {
      const list = await expenseRepo.getCategories(selectedStoreId, type);
      setCategories(list);
      if (list.length > 0) {
        setCategory(list[0].name);
      } else {
        setCategory('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedStoreId, type]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid amount greater than 0',
      });
      return;
    }

    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a title or description',
      });
      return;
    }

    if (!category) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a category or create a new one',
      });
      return;
    }

    try {
      setLoading(true);
      await expenseRepo.create(
        selectedStoreId,
        category,
        title.trim(),
        parsedAmount,
        type,
        note.trim(),
        exDate
      );

      Toast.show({
        type: 'success',
        text1: 'Record Saved',
        text2: `Successfully added ${type === 'expense' ? 'Expense' : 'Income'}`,
      });
      router.back();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to record entry',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Category name is required',
      });
      return;
    }

    try {
      const newCat = await expenseRepo.createCategory(
        selectedStoreId,
        newCatName.trim(),
        type
      );
      Toast.show({
        type: 'success',
        text1: 'Category Created',
        text2: `${newCat.name} is ready to use`,
      });
      setCatModalVisible(false);
      setNewCatName('');
      
      // Reload categories list
      const list = await expenseRepo.getCategories(selectedStoreId, type);
      setCategories(list);
      setCategory(newCat.name);
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create category',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Record Income & Expense
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Toggle Cash flow type */}
        <View style={[styles.toggleSelector, { backgroundColor: isDark ? '#171717' : '#e2e8f0' }]}>
          <TouchableOpacity
            style={[styles.toggleTab, type === 'income' && { backgroundColor: '#10b981' }]}
            onPress={() => setType('income')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up-sharp" size={14} color={type === 'income' ? '#ffffff' : colors.textMuted} />
              <Text style={[styles.toggleTabText, type === 'income' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                CASH IN
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, type === 'expense' && { backgroundColor: '#ef4444' }]}
            onPress={() => setType('expense')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-down-sharp" size={14} color={type === 'expense' ? '#ffffff' : colors.textMuted} />
              <Text style={[styles.toggleTabText, type === 'expense' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                CASH OUT
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Card style={styles.formCard}>
          <Input
            label={`Amount (${currency}) *`}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            autoFocus
          />
          <Input
            label="Title / Description *"
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'expense' ? 'e.g. Shop Rent or Internet bill' : 'e.g. Customer product sales'}
          />

          {/* Custom Category selection grid */}
          <View style={styles.catContainer}>
            <View style={styles.catHeader}>
              <Text style={[styles.catLabel, { color: colors.textMuted }]}>Category *</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(true)}>
                <Text style={[styles.catCreateText, { color: colors.primary }]}>+ New Category</Text>
              </TouchableOpacity>
            </View>

            {categories.length === 0 ? (
              <Text style={[styles.catEmpty, { color: colors.textMuted }]}>
                No categories available. Please create one.
              </Text>
            ) : (
              <View style={styles.catGrid}>
                {categories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategory(cat.name)}
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9',
                          borderColor: isSelected
                            ? type === 'income'
                              ? '#10b981'
                              : '#ef4444'
                            : isDark
                            ? '#353534'
                            : '#cbd5e1'
                        },
                        isSelected && [
                          styles.catBadgeActive,
                          {
                            backgroundColor: type === 'income'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)'
                          }
                        ]
                      ]}
                    >
                      <Text style={[
                        styles.catBadgeText,
                        {
                          color: isSelected
                            ? type === 'income'
                              ? '#10b981'
                              : '#ef4444'
                            : colors.text
                        }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateSelectorRow, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}
          >
            <View>
              <Text style={[styles.dateSelectorLabel, { color: colors.textMuted }]}>Transaction Date</Text>
              <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                {exDate ? new Date(exDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </Text>
            </View>
            <FontAwesome name="calendar" size={16} color={colors.primary} />
          </TouchableOpacity>

          <Input
            label="Additional Notes"
            value={note}
            onChangeText={setNote}
            placeholder="Reference information or transaction details"
          />
        </Card>

        <CustomDatePicker
          visible={showDatePicker}
          value={exDate ? new Date(exDate) : new Date()}
          onClose={() => setShowDatePicker(false)}
          onSelect={(d) => setExDate(d.toISOString())}
        />

        <Button
          title={type === 'expense' ? 'SAVE CASH OUT (Expense)' : 'SAVE CASH IN (Income)'}
          onPress={handleSave}
          loading={loading}
          style={[styles.saveBtn, { backgroundColor: type === 'expense' ? '#ef4444' : '#10b981' }]}
        />
        <View style={styles.bottomGap} />
      </ScrollView>

      {/* Modal to Add New Category */}
      <Modal
        visible={catModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCatModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setCatModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.smallModal, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Add {type === 'expense' ? 'Expense' : 'Income'} Category
            </Text>
            
            <Input
              label="Category Name *"
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="e.g. Marketing or Dividends"
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setCatModalVisible(false)}
                style={styles.flexBtn}
              />
              <Button
                title="Create"
                onPress={handleCreateCategory}
                style={[styles.flexBtn, { backgroundColor: type === 'expense' ? '#ef4444' : '#10b981' }]}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Local styled Card
const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style = {} }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  return (
    <View 
      style={[
        styles.localCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 16,
    padding: 4,
  },
  backText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
    padding: 24,
  },
  toggleSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formCard: {
    padding: 24,
    marginBottom: 24,
  },
  catContainer: {
    marginBottom: 16,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  catCreateText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catEmpty: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catBadgeActive: {
    borderWidth: 2,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    paddingVertical: 14,
  },
  bottomGap: {
    height: 48,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 24,
  },
  smallModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  localCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
  },
  dateSelectorLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateSelectorValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
