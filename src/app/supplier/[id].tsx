import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert, StyleSheet, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { supplierRepo } from '../../repositories/supplierRepo';
import { transactionRepo } from '../../repositories/transactionRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { exportService } from '../../services/exportService';
import { Supplier, Transaction, TransactionType } from '../../types';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { formatCurrency } from '../../utils/currency';
import { formatDate, getDayLabel, formatTime } from '../../utils/date';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { CustomDatePicker } from '../../components/CustomDatePicker';

export default function SupplierProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, currency, selectedStoreId, stores } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal form states
  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<'credit' | 'debit'>('credit'); // credit = we bought (balance up), debit = we paid (balance down)
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Edit Profile modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleOpenEditModal = () => {
    if (!supplier) return;
    setEditName(supplier.name);
    setEditPhone(supplier.phone || '');
    setEditAddress(supplier.address || '');
    setEditModalVisible(true);
  };

  const handleSaveEdits = async () => {
    if (!editName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Supplier name is required',
      });
      return;
    }

    try {
      await supplierRepo.update(id, editName.trim(), editPhone.trim(), editAddress.trim());
      setEditModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Supplier Updated',
        text2: 'Profile details saved successfully',
      });
      loadData();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update supplier details',
      });
    }
  };

  // Edit Transaction states
  const [editTxModalVisible, setEditTxModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxNote, setEditTxNote] = useState('');
  const [editTxType, setEditTxType] = useState<TransactionType>('credit');
  const [editTxDate, setEditTxDate] = useState('');
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  const handleOpenEditTxModal = (tx: Transaction) => {
    setSelectedTx(tx);
    setEditTxAmount(tx.amount.toString());
    setEditTxNote(tx.note || '');
    setEditTxType(tx.type);
    setEditTxDate(tx.created_at);
    setEditTxModalVisible(true);
  };

  const handleSaveTxEdits = async () => {
    if (!selectedTx) return;
    const parsedAmount = parseFloat(editTxAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid amount greater than 0',
      });
      return;
    }

    try {
      await transactionRepo.update(selectedTx.id, parsedAmount, editTxNote.trim(), editTxType, editTxDate);
      setEditTxModalVisible(false);
      setSelectedTx(null);
      Toast.show({
        type: 'success',
        text1: 'Transaction Updated',
        text2: 'Entry has been modified successfully',
      });
      loadData();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update transaction',
      });
    }
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const supp = await supplierRepo.getById(id);
      if (supp) {
        setSupplier(supp);
        const txList = await transactionRepo.getByPartyId(id);
        setTransactions(txList);
      }
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load supplier profile',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSupplier = () => {
    if (!supplier) return;
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.name}? This will delete all their transaction records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await supplierRepo.delete(supplier.id);
            Toast.show({
              type: 'info',
              text1: 'Supplier Deleted',
              text2: `${supplier.name} has been removed`,
            });
            router.back();
          }
        }
      ]
    );
  };

  const handleOpenTransactionModal = (type: 'credit' | 'debit') => {
    setTxType(type);
    setAmount('');
    setNote('');
    setTxDate(new Date().toISOString());
    setModalVisible(true);
  };

  const handleSaveTransaction = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid amount greater than 0',
      });
      return;
    }

    try {
      await transactionRepo.create(
        selectedStoreId,
        id,
        'supplier',
        txType,
        parsedAmount,
        note.trim(),
        txDate
      );
      
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Ledger Updated',
        text2: `Recorded ${txType === 'credit' ? 'Stock Purchase' : 'Payment Made'}`,
      });
      loadData();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to record transaction',
      });
    }
  };

  const handleDeleteTransaction = (tx: Transaction) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this ledger transaction entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await transactionRepo.delete(tx.id);
            Toast.show({
              type: 'info',
              text1: 'Entry Removed',
              text2: 'Ledger updated successfully',
            });
            loadData();
          }
        }
      ]
    );
  };

  const handleShareStatement = async () => {
    if (!supplier) return;
    try {
      await exportService.shareLedgerStatement(
        supplier.name,
        'Supplier',
        transactions,
        supplier.balance,
        currency
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate report file',
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportService.exportTransactionsToCSV(transactions);
      Toast.show({
        type: 'success',
        text1: 'CSV Generated',
        text2: 'Ledger exported successfully',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate CSV file',
      });
    }
  };

  const handleExportPDF = async () => {
    if (!supplier) return;
    try {
      const storeName = stores.find(s => s.id === selectedStoreId)?.name || 'My Business Store';
      await exportService.exportSupplierLedgerToPDF(storeName, supplier, transactions, currency);
      Toast.show({
        type: 'success',
        text1: 'PDF Generated',
        text2: 'Statement exported successfully',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate PDF statement',
      });
    }
  };

  if (isLoading && !supplier) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (!supplier) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Supplier not found</Text>
      </SafeAreaView>
    );
  }

  const weOweThem = supplier.balance > 0;
  const theyOweUs = supplier.balance < 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {supplier.name}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Supplier Ledger
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleOpenEditModal} style={styles.headerActionBtn}>
            <FontAwesome name="pencil" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportPDF} style={styles.headerActionBtn}>
            <FontAwesome name="file-pdf-o" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareStatement} style={styles.headerActionBtn}>
            <FontAwesome name="share-alt" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportCSV} style={styles.headerActionBtn}>
            <FontAwesome5 name="file-csv" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteSupplier} style={styles.headerActionBtn}>
            <FontAwesome name="trash" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Contact details Card */}
        <Card style={styles.card}>
          <View style={styles.contactRow}>
            <View style={[styles.contactAvatar, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' }]}>
              <FontAwesome5 name="building" size={18} color={isDark ? '#c0c1ff' : '#4f46e5'} />
            </View>
            <View style={styles.contactMeta}>
              {supplier.phone ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <FontAwesome name="phone" size={12} color={colors.textMuted} />
                  <Text style={[styles.contactPhone, { color: colors.text, marginBottom: 0 }]}>
                    {supplier.phone}
                  </Text>
                </View>
              ) : null}
              {supplier.address ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <FontAwesome name="map-marker" size={12} color={colors.textMuted} />
                  <Text style={[styles.contactAddress, { color: colors.textMuted }]}>
                    {supplier.address}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.contactAddressEmpty, { color: colors.textMuted }]}>
                  No warehouse address registered
                </Text>
              )}
            </View>
          </View>
        </Card>

        {/* Balance Metric Summary Panel */}
        <Card 
          style={[
            styles.balanceCard, 
            weOweThem 
              ? { backgroundColor: isDark ? 'rgba(103, 0, 27, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: isDark ? 'rgba(103, 0, 27, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
              : theyOweUs 
              ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' } 
              : { backgroundColor: colors.surface, borderColor: colors.border }
          ]}
        >
          <Text style={[styles.balanceTitle, { color: colors.textMuted }]}>
            Net Balance
          </Text>
          <Text style={[
            styles.balanceValue, 
            {
              color: weOweThem 
                ? colors.error 
                : theyOweUs 
                ? '#4edea3' 
                : colors.textMuted
            }
          ]}>
            {formatCurrency(Math.abs(supplier.balance), currency)}
          </Text>
          <Text style={[
            styles.balanceStatus, 
            {
              color: weOweThem 
                ? colors.error 
                : theyOweUs 
                ? '#10b981' 
                : colors.textMuted
            }
          ]}>
            {weOweThem 
              ? 'You owe supplier (Payable)' 
              : theyOweUs 
              ? 'Supplier owes you (Receivable)' 
              : 'All settled up!'}
          </Text>
        </Card>

        {/* Statement list */}
        <View style={styles.timelineContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Ledger Timeline ({transactions.length} entries)
          </Text>

          {transactions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <FontAwesome name="book" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Ledger is Empty</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Record stock purchases and payments using the buttons below.
              </Text>
            </Card>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              return (
                <TouchableOpacity
                  key={tx.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEditTxModal(tx)}
                  onLongPress={() => handleDeleteTransaction(tx)}
                  style={[
                    styles.txItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View style={[styles.txAvatarCircle, { backgroundColor: isCredit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                      <Ionicons name={isCredit ? "trending-up-sharp" : "trending-down-sharp"} size={16} color={isCredit ? "#ef4444" : "#4edea3"} />
                    </View>
                    <View style={styles.txMeta}>
                      <Text style={[styles.txNote, { color: colors.text }]} numberOfLines={2}>
                        {tx.note || (isCredit ? 'Purchase Stock' : 'Payment Made')}
                      </Text>
                      <Text style={[styles.txTimeLabel, { color: colors.textMuted }]}>
                        {formatTime(tx.created_at)} • Tap to edit • Long press to delete
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.txRight}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.txAmount, { color: isCredit ? colors.error : '#4edea3' }]}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                      </Text>
                      <FontAwesome name="pencil" size={10} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.txDate, { color: colors.textMuted }]}>
                      {getDayLabel(tx.created_at).replace(', ', ' ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </View>
        <View style={styles.bottomGap} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomActionBar, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleOpenTransactionModal('credit')}
          style={[styles.actionBtn, styles.giveCreditBtn]}
        >
          <Text style={styles.actionBtnText}>PURCHASE STOCK (Red)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleOpenTransactionModal('debit')}
          style={[styles.actionBtn, styles.getPaymentBtn]}
        >
          <Text style={styles.actionBtnText}>PAY SUPPLIER (Green)</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Drawer Modal for Adding Credit/Debit Record */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.bottomSheet, { backgroundColor: isDark ? '#131313' : '#f8fafc', borderTopColor: colors.border }]}
          >
            <View style={[styles.sheetNotch, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {txType === 'credit' ? 'Record Stock Purchase 📥' : 'Record Payment Made 📤'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Input
              label={`Amount (${currency}) *`}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
            <Input
              label="Note / Remarks"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Purchased wholesale inventory"
            />

            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateSelectorRow, { backgroundColor: isDark ? '#171717' : '#f1f5f9', borderColor: colors.border }]}
            >
              <View>
                <Text style={[styles.dateSelectorLabel, { color: colors.textMuted }]}>Transaction Date</Text>
                <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                  {txDate ? new Date(txDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </Text>
              </View>
              <FontAwesome name="calendar" size={16} color={colors.primary} />
            </TouchableOpacity>

            <CustomDatePicker
              visible={showDatePicker}
              value={txDate ? new Date(txDate) : new Date()}
              onClose={() => setShowDatePicker(false)}
              onSelect={(d) => setTxDate(d.toISOString())}
            />

            <Button
              title={txType === 'credit' ? 'PURCHASED STOCK' : 'PAID SUPPLIER'}
              onPress={handleSaveTransaction}
              style={{ backgroundColor: txType === 'credit' ? '#ef4444' : '#10b981', paddingVertical: 14 }}
            />
            <View style={styles.sheetGap} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* Modal for Editing Supplier Details */}
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
                Edit Supplier Details
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Supplier Name *"
              value={editName}
              onChangeText={setEditName}
              placeholder="Supplier/Business Name"
              autoFocus
            />
            <Input
              label="Contact Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
            />
            <Input
              label="Address"
              value={editAddress}
              onChangeText={setEditAddress}
              placeholder="e.g. Local Market, Floor 1"
              multiline
            />

            <Button
              title="SAVE CHANGES"
              onPress={handleSaveEdits}
              style={{ backgroundColor: colors.primary, paddingVertical: 14 }}
            />
            <View style={styles.sheetGap} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal for Editing Supplier Transaction */}
      <Modal
        visible={editTxModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditTxModalVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setEditTxModalVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.bottomSheet, { backgroundColor: isDark ? '#131313' : '#f8fafc', borderTopColor: colors.border }]}
          >
            <View style={[styles.sheetNotch, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Modify Ledger Transaction
              </Text>
              <TouchableOpacity onPress={() => setEditTxModalVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Transaction Type */}
            <View style={[styles.toggleSelector, { backgroundColor: isDark ? '#171717' : '#e2e8f0', marginHorizontal: 0, marginBottom: 16 }]}>
              <TouchableOpacity
                style={[styles.toggleTab, editTxType === 'credit' && { backgroundColor: '#ef4444' }]}
                onPress={() => setEditTxType('credit')}
              >
                <Text style={[styles.toggleTabText, editTxType === 'credit' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                  PURCHASE CREDIT 📥
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleTab, editTxType === 'debit' && { backgroundColor: '#10b981' }]}
                onPress={() => setEditTxType('debit')}
              >
                <Text style={[styles.toggleTabText, editTxType === 'debit' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                  PAID SUPPLIER 📤
                </Text>
              </TouchableOpacity>
            </View>

            <Input
              label={`Amount (${currency}) *`}
              value={editTxAmount}
              onChangeText={setEditTxAmount}
              placeholder="0.00"
              keyboardType="numeric"
              autoFocus
            />
            <Input
              label="Note / Remarks"
              value={editTxNote}
              onChangeText={setEditTxNote}
              placeholder="e.g. Purchased wholesale inventory"
            />

            <TouchableOpacity 
              onPress={() => setShowEditDatePicker(true)}
              style={[styles.dateSelectorRow, { backgroundColor: isDark ? '#171717' : '#f1f5f9', borderColor: colors.border }]}
            >
              <View>
                <Text style={[styles.dateSelectorLabel, { color: colors.textMuted }]}>Transaction Date</Text>
                <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                  {editTxDate ? new Date(editTxDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                </Text>
              </View>
              <FontAwesome name="calendar" size={16} color={colors.primary} />
            </TouchableOpacity>

            <CustomDatePicker
              visible={showEditDatePicker}
              value={editTxDate ? new Date(editTxDate) : new Date()}
              onClose={() => setShowEditDatePicker(false)}
              onSelect={(d) => setEditTxDate(d.toISOString())}
            />

            <Button
              title="UPDATE TRANSACTION"
              onPress={handleSaveTxEdits}
              style={{ backgroundColor: editTxType === 'credit' ? '#ef4444' : '#10b981', paddingVertical: 14 }}
            />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionBtn: {
    padding: 6,
  },
  headerActionText: {
    fontSize: 16,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarIcon: {
    fontSize: 20,
  },
  contactMeta: {
    flex: 1,
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
  },
  contactAddress: {
    fontSize: 11,
  },
  contactAddressEmpty: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  balanceTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  balanceStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  timelineContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
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
  txItem: {
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
  txAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: {
    fontSize: 13,
  },
  txMeta: {
    flex: 1,
  },
  txNote: {
    fontSize: 13,
    fontWeight: '700',
  },
  txTimeLabel: {
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
    height: 90,
  },
  bottomActionBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giveCreditBtn: {
    backgroundColor: '#ef4444',
  },
  getPaymentBtn: {
    backgroundColor: '#10b981',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
  sheetGap: {
    height: 12,
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
