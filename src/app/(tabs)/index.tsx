import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform, StatusBar, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { reportService, DashboardSummary } from '../../services/reportService';
import { expenseRepo } from '../../repositories/expenseRepo';
import { Expense, ExpenseType, Category } from '../../types';
import { Card } from '../../components/Card';
import { StoreSwitcher } from '../../components/StoreSwitcher';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../utils/currency';
import { getDayLabel, formatTime } from '../../utils/date';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, currency, selectedStoreId, selectedStore } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentCashTransactions, setRecentCashTransactions] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switcherVisible, setSwitcherVisible] = useState(false);

  // Edit Expense States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<ExpenseType>('expense');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState<string>(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedStoreId) return;
    try {
      setIsLoading(true);
      const data = await reportService.getDashboardSummary(selectedStoreId);
      setSummary(data);

      const cashTxs = await expenseRepo.getAll(selectedStoreId);
      setRecentCashTransactions(cashTxs.slice(0, 5));

      const cats = await expenseRepo.getCategories(selectedStoreId, editType);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedStoreId, editType]);

  const handleOpenEditModal = async (expense: Expense) => {
    setSelectedExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditTitle(expense.title);
    setEditCategory(expense.category);
    setEditType(expense.type);
    setEditNote(expense.note || '');
    setEditDate(expense.created_at);
    
    // Fetch categories for this type
    try {
      const cats = await expenseRepo.getCategories(selectedStoreId, expense.type);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
    
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid amount greater than 0',
      });
      return;
    }

    if (!editTitle.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a title or description',
      });
      return;
    }

    if (!editCategory) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please select a category',
      });
      return;
    }

    try {
      await expenseRepo.update(
        selectedExpense.id,
        editCategory,
        editTitle.trim(),
        parsedAmount,
        editType,
        editNote.trim(),
        editDate
      );
      setEditModalVisible(false);
      setSelectedExpense(null);
      Toast.show({
        type: 'success',
        text1: 'Record Updated',
        text2: 'Cash entry has been modified successfully',
      });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update record',
      });
    }
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this cash book entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseRepo.delete(selectedExpense.id);
              setEditModalVisible(false);
              setSelectedExpense(null);
              Toast.show({
                type: 'info',
                text1: 'Record Deleted',
                text2: 'Cash entry has been removed',
              });
              fetchDashboardData();
            } catch (e) {
              console.error(e);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete record',
              });
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* App Header Bar */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setSwitcherVisible(true)}
          style={styles.storeSelectButton}
        >
          <View style={[styles.storeIconCircle, { backgroundColor: isDark ? '#c0c1ff20' : '#e0e7ff' }]}>
            <FontAwesome5 name="store" size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.storeNameText, { color: colors.primary }]}>
              {selectedStore?.name || 'My Store'}
            </Text>
            <Text style={[styles.storeSwitcherLabel, { color: colors.textMuted }]}>
              Switch Store <Text style={styles.dropdownArrow}>▼</Text>
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/reports')}
          style={[styles.headerReportButton, { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9' }]}
        >
          <Ionicons name="bar-chart-sharp" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Receivables & Payables Summary Metrics */}
        <View style={styles.row}>
          {/* Receivable Card */}
          <Card style={[styles.metricCard, styles.receivableBorder]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>You will get</Text>
            <Text style={[styles.cardValue, styles.emeraldText]}>
              {formatCurrency(summary?.totalReceivable || 0, currency)}
            </Text>
            <Text style={[styles.cardSubText, { color: colors.textMuted }]}>
              Across {summary?.customerCount || 0} customers
            </Text>
          </Card>

          {/* Payable Card */}
          <Card style={[styles.metricCard, styles.payableBorder]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>You will give</Text>
            <Text style={[styles.cardValue, { color: colors.error }]}>
              {formatCurrency(summary?.totalPayable || 0, currency)}
            </Text>
            <Text style={[styles.cardSubText, { color: colors.textMuted }]}>
              To {summary?.supplierCount || 0} suppliers
            </Text>
          </Card>
        </View>

        {/* Today's Cashflow Panel */}
        <Card style={styles.cashflowCard}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Today's Cashflow (Income & Expenses)
          </Text>
          <View style={styles.cashflowRow}>
            <View style={styles.cashflowCol}>
              <Text style={[styles.cashflowLabel, { color: colors.textMuted }]}>Cash In (Sales)</Text>
              <Text style={[styles.cashflowValue, styles.emeraldText]}>
                +{formatCurrency(summary?.todayIncome || 0, currency)}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.cashflowCol}>
              <Text style={[styles.cashflowLabel, { color: colors.textMuted }]}>Cash Out (Expenses)</Text>
              <Text style={[styles.cashflowValue, { color: colors.error }]}>
                -{formatCurrency(summary?.todayExpense || 0, currency)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Action Controls */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 12 }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('/expense/create')}
              style={styles.actionItem}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}>
                <FontAwesome5 name="money-bill-wave" size={18} color={isDark ? '#c0c1ff' : '#4f46e5'} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>Add Cash</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('/customer/create')}
              style={styles.actionItem}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}>
                <FontAwesome5 name="user-plus" size={18} color={isDark ? '#c0c1ff' : '#4f46e5'} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>+ Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleQuickAction('/supplier/create')}
              style={styles.actionItem}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}>
                <FontAwesome5 name="box-open" size={18} color={isDark ? '#c0c1ff' : '#4f46e5'} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.text }]}>+ Supplier</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Cash Book Entries List */}
        <View style={styles.recentTransactionsContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Recent Cash Book Entries
            </Text>
            {recentCashTransactions.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/reports')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentCashTransactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <FontAwesome5 name="book-open" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Cash Entries Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Tap "Add Cash" above to record cash income or expenses.
              </Text>
            </Card>
          ) : (
            recentCashTransactions.map((item) => {
              const isIncome = item.type === 'income';
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditModal(item)}
                  style={[
                    styles.transactionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txIconCircle, { backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                      <Ionicons name={isIncome ? "trending-up-sharp" : "trending-down-sharp"} size={16} color={isIncome ? "#4edea3" : "#ffb2b7"} />
                    </View>
                    <View style={styles.txMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.txNote, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        <FontAwesome name="pencil" size={10} color={colors.textMuted} />
                      </View>
                      <Text style={[styles.txPartyLabel, { color: colors.textMuted }]}>
                        {item.category.toUpperCase()} • {formatTime(item.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: isIncome ? '#4edea3' : colors.error }]}>
                      {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>
                      {getDayLabel(item.created_at).replace(', ', ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
        <View style={styles.bottomGap} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/transaction/create')}
        style={[styles.fab, { backgroundColor: isDark ? '#c0c1ff' : '#4f46e5' }]}
      >
        <Text style={[styles.fabText, { color: isDark ? '#1000a9' : '#ffffff' }]}>+</Text>
      </TouchableOpacity>

      {/* Modal for Editing Cash Entry */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setEditModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.bottomSheet, { backgroundColor: isDark ? '#131313' : '#f8fafc', borderTopColor: colors.border }]}
          >
            <View style={[styles.sheetNotch, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Modify Cash Book Entry
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Cash flow type */}
            <View style={[styles.toggleSelector, { backgroundColor: isDark ? '#171717' : '#e2e8f0', marginHorizontal: 0, marginBottom: 16 }]}>
              <TouchableOpacity
                style={[styles.toggleTab, editType === 'income' && { backgroundColor: '#10b981' }]}
                onPress={async () => {
                  setEditType('income');
                  try {
                    const cats = await expenseRepo.getCategories(selectedStoreId, 'income');
                    setCategories(cats);
                    if (cats.length > 0) setEditCategory(cats[0].name);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Text style={[styles.toggleTabText, editType === 'income' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                  CASH IN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, editType === 'expense' && { backgroundColor: '#ef4444' }]}
                onPress={async () => {
                  setEditType('expense');
                  try {
                    const cats = await expenseRepo.getCategories(selectedStoreId, 'expense');
                    setCategories(cats);
                    if (cats.length > 0) setEditCategory(cats[0].name);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Text style={[styles.toggleTabText, editType === 'expense' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                  CASH OUT
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label={`Amount (${currency}) *`}
              value={editAmount}
              onChangeText={setEditAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
            
            <Input
              label="Title / Description *"
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="e.g. Sales Income or Rent bill"
            />

            {/* Categories Selector */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.catLabel, { color: colors.textMuted, marginBottom: 8 }]}>Category *</Text>
              <View style={styles.catGrid}>
                {categories.map((cat) => {
                  const isSelected = editCategory === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setEditCategory(cat.name)}
                      style={[
                        styles.catBadge,
                        {
                          backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9',
                          borderColor: isSelected
                            ? editType === 'income'
                              ? '#10b981'
                              : '#ef4444'
                            : isDark
                            ? '#353534'
                            : '#cbd5e1'
                        },
                        isSelected && {
                          backgroundColor: editType === 'income'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          borderWidth: 2
                        }
                      ]}
                    >
                      <Text style={[
                        styles.catBadgeText,
                        {
                          color: isSelected
                            ? editType === 'income'
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
            </View>

            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateSelectorRow, { backgroundColor: isDark ? '#171717' : '#f1f5f9', borderColor: colors.border }]}
            >
              <View>
                <Text style={[styles.dateSelectorLabel, { color: colors.textMuted }]}>Transaction Date</Text>
                <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                  {editDate ? new Date(editDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </Text>
              </View>
              <FontAwesome name="calendar" size={16} color={colors.primary} />
            </TouchableOpacity>

            <CustomDatePicker
              visible={showDatePicker}
              value={editDate ? new Date(editDate) : new Date()}
              onClose={() => setShowDatePicker(false)}
              onSelect={(d) => setEditDate(d.toISOString())}
            />

            <Input
              label="Note / Remarks"
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Reference info"
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button
                title="DELETE"
                onPress={handleDeleteExpense}
                style={{ flex: 1, backgroundColor: '#b91c1c', paddingVertical: 14 }}
              />
              <Button
                title="SAVE CHANGES"
                onPress={handleSaveEdit}
                style={{ flex: 2, backgroundColor: editType === 'income' ? '#10b981' : '#ef4444', paddingVertical: 14 }}
              />
            </View>
            <View style={styles.sheetGap} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <StoreSwitcher 
        visible={switcherVisible} 
        onClose={() => setSwitcherVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    borderBottomWidth: 1,
  },
  storeSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIconEmoji: {
    fontSize: 16,
  },
  storeNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  storeSwitcherLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 8,
  },
  headerReportButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIconEmoji: {
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
  },
  receivableBorder: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  payableBorder: {
    borderLeftWidth: 3,
    borderLeftColor: '#f43f5e',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 9,
  },
  emeraldText: {
    color: '#4edea3',
  },
  cashflowCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cashflowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cashflowCol: {
    flex: 1,
  },
  cashflowLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  cashflowValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  recentTransactionsContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconEmoji: {
    fontSize: 14,
  },
  txMeta: {
    flex: 1,
  },
  txNote: {
    fontSize: 13,
    fontWeight: '700',
  },
  txPartyLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 9,
    marginTop: 2,
  },
  bottomGap: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
  },
  sheetNotch: {
    width: 48,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetGap: {
    height: 12,
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
  catLabel: {
    fontSize: 11,
    fontWeight: '600',
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
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
