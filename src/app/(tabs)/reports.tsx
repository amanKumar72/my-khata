import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, Platform, StatusBar, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { reportService, PeriodicReport } from '../../services/reportService';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../utils/currency';
import { Colors } from '../../constants/Colors';
import Toast from 'react-native-toast-message';
import { expenseRepo } from '../../repositories/expenseRepo';
import { Expense, Category, ExpenseType } from '../../types';
import { formatDate, formatTime, getStartAndEndDates } from '../../utils/date';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { exportService } from '../../services/exportService';
import { CustomDatePicker } from '../../components/CustomDatePicker';

type PeriodType = 'day' | 'week' | 'month' | 'year';

export default function ReportsScreen() {
  const { theme, currency, selectedStoreId, stores } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [period, setPeriod] = useState<PeriodType>('month');
  const [report, setReport] = useState<PeriodicReport | null>(null);
  const [categoriesBreakdown, setCategoriesBreakdown] = useState<{ category: string; amount: number; percentage: number }[]>([]);
  const [breakdownType, setBreakdownType] = useState<'expense' | 'income'>('expense');
  const [cashHistory, setCashHistory] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleExportPDF = async () => {
    try {
      const storeName = stores.find(s => s.id === selectedStoreId)?.name || 'My Business Store';
      await exportService.exportCashBookToPDF(storeName, cashHistory, currency);
      Toast.show({
        type: 'success',
        text1: 'PDF Statement Exported',
        text2: 'Cash Book statement has been generated successfully',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate PDF statement',
      });
    }
  };

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

  // Reports Date Filtering States
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [showReportDatePicker, setShowReportDatePicker] = useState(false);

  const fetchReportData = useCallback(async () => {
    if (!selectedStoreId) return;
    try {
      setIsLoading(true);
      const rep = await reportService.getPeriodicReport(selectedStoreId, period, reportDate);
      setReport(rep);

      const breakdown = await reportService.getCategoryReport(selectedStoreId, breakdownType, period, reportDate);
      setCategoriesBreakdown(breakdown);

      const history = await expenseRepo.getAll(selectedStoreId);
      const dates = getStartAndEndDates(period, reportDate);
      const startMs = dates.start.getTime();
      const endMs = dates.end.getTime();
      const filteredHistory = history.filter(item => {
        const itemTime = new Date(item.created_at).getTime();
        return itemTime >= startMs && itemTime <= endMs;
      });
      setCashHistory(filteredHistory);

      const cats = await expenseRepo.getCategories(selectedStoreId, editType);
      setCategories(cats);
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to compute reports',
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedStoreId, period, breakdownType, editType, reportDate]);

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
      fetchReportData();
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
              fetchReportData();
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
      fetchReportData();
    }, [fetchReportData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const handlePeriodTabPress = (p: PeriodType) => {
    setPeriod(p);
    setShowReportDatePicker(true);
  };

  const getPeriodLabel = () => {
    const dates = getStartAndEndDates(period, reportDate);
    switch (period) {
      case 'day':
        return reportDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      case 'week':
        const startStr = dates.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const endStr = dates.end.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        return `${startStr} - ${endStr}`;
      case 'month':
        return reportDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      case 'year':
        return reportDate.getFullYear().toString();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with timespan controls */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.headerTitle, { color: colors.text, marginBottom: 0 }]}>
            Business Statements
          </Text>
          <TouchableOpacity onPress={handleExportPDF} style={{ padding: 8 }}>
            <FontAwesome name="file-pdf-o" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Tab timespan selector */}
        <View style={[styles.tabsWrapper, { backgroundColor: isDark ? '#171717' : '#e2e8f0' }]}>
          {(['day', 'week', 'month', 'year'] as PeriodType[]).map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => handlePeriodTabPress(p)}
                style={[styles.tabBtn, isActive && [styles.tabBtnActive, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]]}
              >
                <Text style={[styles.tabBtnText, { color: isActive ? colors.text : colors.textMuted }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active timespan display with calendar toggle */}
        <TouchableOpacity 
          onPress={() => setShowReportDatePicker(true)}
          style={[styles.dateFilterRow, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FontAwesome name="calendar" size={12} color={colors.primary} />
            <Text style={[styles.dateFilterText, { color: colors.text, fontSize: 11, fontWeight: '700' }]}>
              {getPeriodLabel()}
            </Text>
          </View>
          <FontAwesome name="chevron-down" size={10} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <CustomDatePicker
        visible={showReportDatePicker}
        value={reportDate}
        onClose={() => setShowReportDatePicker(false)}
        onSelect={(d) => setReportDate(d)}
      />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Core Profit/Loss Metric Card */}
        {report && (
          <Card style={styles.plCard}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              Net Cashflow Profit ({getPeriodLabel()})
            </Text>
            <Text style={[styles.plValue, { color: report.profit >= 0 ? '#4edea3' : colors.error }]}>
              {report.profit >= 0 ? '+' : ''}{formatCurrency(report.profit, currency)}
            </Text>
            <Text style={[styles.plMeta, { color: colors.textMuted }]}>
              Based on pure cash entries in SQLite
            </Text>
          </Card>
        )}

        {/* Detailed periodic Income and Expense Breakdown */}
        <View style={styles.row}>
          <Card style={styles.metricCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: 8, marginBottom: 0 }]}>
                Total Income
              </Text>
              <Ionicons name="trending-up-sharp" size={10} color="#10b981" />
            </View>
            <Text style={[styles.metricValue, styles.emeraldText]}>
              {formatCurrency(report?.income || 0, currency)}
            </Text>
          </Card>
          
          <Card style={styles.metricCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted, fontSize: 8, marginBottom: 0 }]}>
                Total Expense
              </Text>
              <Ionicons name="trending-down-sharp" size={10} color="#ef4444" />
            </View>
            <Text style={[styles.metricValue, { color: colors.error }]}>
              {formatCurrency(report?.expense || 0, currency)}
            </Text>
          </Card>
        </View>

        {/* Ledger receivables/payables statement */}
        <Card style={styles.ledgerCard}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Store Ledger Balance
          </Text>
          <View style={styles.ledgerRow}>
            <Text style={[styles.ledgerLabel, { color: colors.text }]}>Receivable (Customers owe)</Text>
            <Text style={[styles.ledgerVal, styles.emeraldText]}>
              {formatCurrency(report?.receivable || 0, currency)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.ledgerRow}>
            <Text style={[styles.ledgerLabel, { color: colors.text }]}>Payable (We owe suppliers)</Text>
            <Text style={[styles.ledgerVal, { color: colors.error }]}>
              {formatCurrency(report?.payable || 0, currency)}
            </Text>
          </View>
        </Card>

        {/* Category analysis charts */}
        <View style={styles.allocationsContainer}>
          <View style={styles.allocationsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 0 }]}>
              Category Allocations
            </Text>
            
            {/* Toggle breakdown type */}
            <View style={[styles.toggleWrapper, { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9' }]}>
              <TouchableOpacity
                onPress={() => setBreakdownType('expense')}
                style={[styles.toggleBtn, breakdownType === 'expense' && { backgroundColor: isDark ? 'rgba(255, 178, 183, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}
              >
                <Text style={[styles.toggleBtnText, { color: breakdownType === 'expense' ? colors.error : colors.textMuted }]}>Outflow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBreakdownType('income')}
                style={[styles.toggleBtn, breakdownType === 'income' && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
              >
                <Text style={[styles.toggleBtnText, { color: breakdownType === 'income' ? '#10b981' : colors.textMuted }]}>Inflow</Text>
              </TouchableOpacity>
            </View>
          </View>

          {categoriesBreakdown.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Cashflow Data</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Add some Cash In/Out records in this period to review allocations.
              </Text>
            </Card>
          ) : (
            categoriesBreakdown.map((item, idx) => (
              <Card key={idx} style={styles.allocCard}>
                <View style={styles.allocRow}>
                  <Text style={[styles.allocName, { color: colors.text }]}>
                    {item.category}
                  </Text>
                  <Text style={[styles.allocVal, { color: breakdownType === 'expense' ? colors.error : '#10b981' }]}>
                    {formatCurrency(item.amount, currency)} ({item.percentage}%)
                  </Text>
                </View>
                
                {/* Horizontal custom progress bar */}
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${item.percentage}%`,
                        backgroundColor: breakdownType === 'expense' ? '#ef4444' : '#10b981'
                      }
                    ]}
                  />
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Cash In / Out History (Add Cash) */}
        <View style={styles.allocationsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted, marginBottom: 12 }]}>
            Cash Book History (Income & Expenses)
          </Text>

          {cashHistory.length === 0 ? (
            <Card style={styles.emptyCard}>
              <FontAwesome5 name="book-open" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Cash Entries</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Tap "Add Cash" on the Home dashboard to record cash income or expense.
              </Text>
            </Card>
          ) : (
            cashHistory.map((item) => {
              const isIncome = item.type === 'income';
              return (
                <TouchableOpacity 
                  key={item.id} 
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditModal(item)}
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <View style={[styles.historyAvatarCircle, { backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                      <Ionicons name={isIncome ? "trending-up-sharp" : "trending-down-sharp"} size={14} color={isIncome ? "#4edea3" : "#ffb2b7"} />
                    </View>
                    <View style={styles.historyMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.historyTitle, { color: colors.text }]}>
                          {item.title}
                        </Text>
                        <FontAwesome name="pencil" size={10} color={colors.textMuted} />
                      </View>
                      <Text style={[styles.historySubText, { color: colors.textMuted }]}>
                        {item.category} {item.note ? `• ${item.note}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={[styles.historyAmount, { color: isIncome ? '#4edea3' : colors.error }]}>
                      {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
                    </Text>
                    <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={styles.bottomGap} />
      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  plCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  plValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  plMeta: {
    fontSize: 9,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  emeraldText: {
    color: '#4edea3',
  },
  ledgerCard: {
    marginBottom: 20,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  ledgerLabel: {
    fontSize: 12,
  },
  ledgerVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  allocationsContainer: {
    marginBottom: 20,
  },
  allocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleWrapper: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  allocCard: {
    marginBottom: 8,
    padding: 12,
  },
  allocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allocName: {
    fontSize: 12,
    fontWeight: '700',
  },
  allocVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyIconEmoji: {
    fontSize: 12,
  },
  historyMeta: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  historySubText: {
    fontSize: 9,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 9,
    marginTop: 2,
  },
  bottomGap: {
    height: 60,
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
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    width: '100%',
  },
  dateFilterText: {
    fontSize: 11,
  },
});
