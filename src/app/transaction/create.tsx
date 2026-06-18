import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { customerRepo } from '../../repositories/customerRepo';
import { supplierRepo } from '../../repositories/supplierRepo';
import { transactionRepo } from '../../repositories/transactionRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { Customer, Supplier, PartyType, TransactionType } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { CustomDatePicker } from '../../components/CustomDatePicker';

export default function CreateTransactionScreen() {
  const router = useRouter();
  const { theme, currency, selectedStoreId } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Toggles
  const [partyType, setPartyType] = useState<PartyType>('customer');
  const [txType, setTxType] = useState<TransactionType>('credit'); // credit = gave credit / bought stock, debit = got payment / paid supplier

  // Contacts lists
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedParty, setSelectedParty] = useState<Customer | Supplier | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchParties = async () => {
      if (!selectedStoreId) return;
      try {
        if (partyType === 'customer') {
          const list = searchQuery.trim()
            ? await customerRepo.search(selectedStoreId, searchQuery)
            : await customerRepo.getAll(selectedStoreId);
          setCustomers(list);
        } else {
          const list = searchQuery.trim()
            ? await supplierRepo.search(selectedStoreId, searchQuery)
            : await supplierRepo.getAll(selectedStoreId);
          setSuppliers(list);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchParties();
  }, [selectedStoreId, partyType, searchQuery]);

  const handleSave = async () => {
    if (!selectedParty) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: `Please select a ${partyType}`,
      });
      return;
    }

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
      setLoading(true);
      await transactionRepo.create(
        selectedStoreId,
        selectedParty.id,
        partyType,
        txType,
        parsedAmount,
        note.trim(),
        txDate
      );



      Toast.show({
        type: 'success',
        text1: 'Transaction Recorded',
        text2: 'Ledger has been updated successfully',
      });
      router.back();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save transaction',
      });
    } finally {
      setLoading(false);
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
          Quick Book Transaction
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Toggle Party Type */}
        <View style={[styles.toggleSelector, { backgroundColor: isDark ? '#171717' : '#e2e8f0' }]}>
          <TouchableOpacity
            style={[styles.toggleTab, partyType === 'customer' && [styles.toggleTabActive, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]]}
            onPress={() => {
              setPartyType('customer');
              setSelectedParty(null);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FontAwesome name="user" size={13} color={partyType === 'customer' ? colors.text : colors.textMuted} />
              <Text style={[styles.toggleTabText, partyType === 'customer' ? { color: colors.text } : { color: colors.textMuted }]}>
                CUSTOMER
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, partyType === 'supplier' && [styles.toggleTabActive, { backgroundColor: isDark ? '#2a2a2a' : '#ffffff' }]]}
            onPress={() => {
              setPartyType('supplier');
              setSelectedParty(null);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FontAwesome5 name="building" size={12} color={partyType === 'supplier' ? colors.text : colors.textMuted} style={{ marginTop: -1 }} />
              <Text style={[styles.toggleTabText, partyType === 'supplier' ? { color: colors.text } : { color: colors.textMuted }]}>
                SUPPLIER
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {selectedParty ? (
          <View style={[styles.selectedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.selectedLeft}>
              <View style={[styles.selectedAvatar, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' }]}>
                {partyType === 'customer' ? (
                  <FontAwesome name="user" size={16} color={colors.text} />
                ) : (
                  <FontAwesome5 name="building" size={14} color={colors.text} />
                )}
              </View>
              <View>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {selectedParty.name}
                </Text>
                <Text style={[styles.selectedBalance, { color: colors.textMuted }]}>
                  Current Balance: {formatCurrency(selectedParty.balance, currency)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSelectedParty(null)} style={styles.changeBtn}>
              <Text style={[styles.changeBtnText, { color: colors.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectContainer}>
            <Text style={[styles.selectLabel, { color: colors.textMuted }]}>
              Select {partyType === 'customer' ? 'Customer' : 'Supplier'} Ledger *
            </Text>
            
            {/* Inner Search */}
            <TextInput
              placeholder={`Search ${partyType} by name...`}
              placeholderTextColor={isDark ? '#464554' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.selectSearchInput,
                {
                  backgroundColor: isDark ? '#171717' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
            />

            {/* Flat inline list */}
            <View style={[styles.listWrapper, { borderColor: colors.border }]}>
              {(partyType === 'customer' ? customers : suppliers).length === 0 ? (
                <View style={styles.emptySearch}>
                  <Text style={[styles.emptySearchText, { color: colors.textMuted }]}>
                    No matching contacts found.
                  </Text>
                </View>
              ) : (
                <ScrollView nestedScrollEnabled style={styles.listScroll}>
                  {(partyType === 'customer' ? customers : suppliers).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedParty(item)}
                      style={[
                        styles.listItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border
                        }
                      ]}
                    >
                      <Text style={[styles.listItemName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.listItemBalance, { color: colors.textMuted }]}>
                        Bal: {formatCurrency(item.balance, currency)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Toggle Transaction Type */}
        <View style={[styles.toggleSelector, { backgroundColor: isDark ? '#171717' : '#e2e8f0' }]}>
          <TouchableOpacity
            style={[styles.toggleTab, txType === 'credit' && { backgroundColor: '#ef4444' }]}
            onPress={() => setTxType('credit')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={partyType === 'customer' ? "trending-down-sharp" : "trending-up-sharp"} size={14} color={txType === 'credit' ? '#ffffff' : colors.textMuted} />
              <Text style={[styles.toggleTabText, txType === 'credit' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                {partyType === 'customer' ? 'GAVE CREDIT' : 'PURCHASE CREDIT'}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleTab, txType === 'debit' && { backgroundColor: '#10b981' }]}
            onPress={() => setTxType('debit')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={partyType === 'customer' ? "trending-up-sharp" : "trending-down-sharp"} size={14} color={txType === 'debit' ? '#ffffff' : colors.textMuted} />
              <Text style={[styles.toggleTabText, txType === 'debit' ? { color: '#ffffff' } : { color: colors.textMuted }]}>
                {partyType === 'customer' ? 'GOT PAYMENT' : 'PAID SUPPLIER'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form fields */}
        <Card style={styles.formCard}>
          <Input
            label={`Amount (${currency}) *`}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
          />
          <Input
            label="Transaction Note"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Sales Invoice #4021"
          />
          
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateSelectorRow, { backgroundColor: isDark ? '#171717' : '#f8fafc', borderColor: colors.border }]}
          >
            <View>
              <Text style={[styles.dateSelectorLabel, { color: colors.textMuted }]}>Transaction Date</Text>
              <Text style={[styles.dateSelectorValue, { color: colors.text }]}>
                {txDate ? new Date(txDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </Text>
            </View>
            <FontAwesome name="calendar" size={16} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        <CustomDatePicker
          visible={showDatePicker}
          value={txDate ? new Date(txDate) : new Date()}
          onClose={() => setShowDatePicker(false)}
          onSelect={(d) => setTxDate(d.toISOString())}
        />

        <Button
          title="Save Ledger Transaction"
          onPress={handleSave}
          loading={loading}
          style={[styles.saveBtn, { backgroundColor: txType === 'credit' ? '#ef4444' : '#10b981' }]}
        />
        <View style={styles.bottomGap} />
      </ScrollView>
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
  toggleTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAvatarText: {
    fontSize: 16,
  },
  selectedName: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedBalance: {
    fontSize: 10,
    marginTop: 2,
  },
  changeBtn: {
    padding: 4,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectContainer: {
    marginBottom: 20,
  },
  selectLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectSearchInput: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  listWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptySearch: {
    padding: 16,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  listScroll: {
    maxHeight: 140,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  listItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  listItemBalance: {
    fontSize: 10,
  },
  formCard: {
    padding: 24,
    marginBottom: 24,
  },
  saveBtn: {
    paddingVertical: 14,
  },
  bottomGap: {
    height: 48,
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
    marginTop: 16,
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
