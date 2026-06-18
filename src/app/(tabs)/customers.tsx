import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, SafeAreaView, RefreshControl, StyleSheet, Platform, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { customerRepo } from '../../repositories/customerRepo';
import { Customer } from '../../types';
import { Button } from '../../components/Button';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Colors } from '../../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Toast from 'react-native-toast-message';
import { exportService } from '../../services/exportService';

export default function CustomersScreen() {
  const router = useRouter();
  const { theme, currency, selectedStoreId, stores } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [customers, setCustomers] = useState<Customer[]>([]);

  const handleExportPDF = async () => {
    try {
      const storeName = stores.find(s => s.id === selectedStoreId)?.name || 'My Business Store';
      await exportService.exportAllCustomersToPDF(storeName, customers, currency);
      Toast.show({
        type: 'success',
        text1: 'PDF Exported',
        text2: 'Customer summary ledger sheet generated successfully',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Could not generate PDF summary',
      });
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    if (!selectedStoreId) return;
    try {
      setIsLoading(true);
      let list: Customer[] = [];
      if (searchQuery.trim()) {
        list = await customerRepo.search(selectedStoreId, searchQuery.trim());
      } else {
        list = await customerRepo.getAll(selectedStoreId);
      }
      setCustomers(list);

      // Sum all positive balances
      const total = list
        .filter(c => c.balance > 0)
        .reduce((sum, c) => sum + c.balance, 0);
      setTotalReceivable(total);
    } catch (e) {
      console.error('Failed to load customers:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedStoreId, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [fetchCustomers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search & Header Bar */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Customers Ledger
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={handleExportPDF} style={{ padding: 8 }}>
              <FontAwesome name="file-pdf-o" size={18} color={colors.text} />
            </TouchableOpacity>
            <Button
              title="+ Add Customer"
              onPress={() => router.push('/customer/create')}
              style={styles.addButton}
            />
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#171717' : '#f1f5f9', borderColor: colors.border }]}>
          <FontAwesome name="search" size={14} color={isDark ? '#464554' : '#94a3b8'} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search Customer by name..."
            placeholderTextColor={isDark ? '#464554' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Aggregate Summary Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
        <View>
          <Text style={[styles.bannerLabel, { color: colors.textMuted }]}>Total Receivables</Text>
          <Text style={styles.bannerValue}>
            {formatCurrency(totalReceivable, currency)}
          </Text>
        </View>
        <Ionicons name="trending-up-sharp" size={22} color="#10b981" />
      </View>

      <ScrollView
        style={styles.scrollList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {customers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="users" size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Customers Found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {searchQuery ? 'Try adjusting your search query.' : 'Keep track of credits and payments. Create your first customer ledger record.'}
            </Text>
            {!searchQuery && (
              <Button
                title="Create New Customer"
                onPress={() => router.push('/customer/create')}
              />
            )}
          </View>
        ) : (
          customers.map((c) => {
            const doesOweUs = c.balance > 0;
            const doWeOweThem = c.balance < 0;
            const isSettled = c.balance === 0;
            
            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.75}
                onPress={() => router.push(`/customer/${c.id}`)}
                style={[
                  styles.customerItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }
                ]}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.avatar, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {c.name.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.customerName, { color: colors.text }]}>
                      {c.name}
                    </Text>
                    {c.phone ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <FontAwesome name="phone" size={10} color={colors.textMuted} />
                        <Text style={[styles.customerPhone, { color: colors.textMuted, marginTop: 0 }]}>
                          {c.phone}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.lastActiveText, { color: colors.textMuted }]}>
                      Last Active: {c.last_transaction_date ? formatDate(c.last_transaction_date) : 'No transactions'}
                    </Text>
                  </View>
                </View>

                {/* Balance display */}
                <View style={styles.itemRight}>
                  {doesOweUs && (
                    <>
                      <Text style={[styles.balanceValue, styles.emeraldText]}>
                        {formatCurrency(c.balance, currency)}
                      </Text>
                      <Text style={styles.balanceStatusEmerald}>You will get</Text>
                    </>
                  )}
                  {doWeOweThem && (
                    <>
                      <Text style={[styles.balanceValue, { color: colors.error }]}>
                        {formatCurrency(Math.abs(c.balance), currency)}
                      </Text>
                      <Text style={[styles.balanceStatusCoral, { color: colors.error }]}>You will give</Text>
                    </>
                  )}
                  {isSettled && (
                    <>
                      <Text style={[styles.balanceValue, { color: colors.textMuted }]}>
                        {formatCurrency(0, currency)}
                      </Text>
                      <Text style={[styles.balanceStatusMuted, { color: colors.textMuted }]}>Settled</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )
          })
        )}
        <View style={styles.bottomGap} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#908fa0',
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  bannerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  bannerIcon: {
    fontSize: 22,
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 14,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  customerPhone: {
    fontSize: 11,
    marginTop: 2,
  },
  lastActiveText: {
    fontSize: 9,
    marginTop: 3,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emeraldText: {
    color: '#4edea3',
  },
  balanceStatusEmerald: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  balanceStatusCoral: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  balanceStatusMuted: {
    fontSize: 9,
    marginTop: 2,
  },
  bottomGap: {
    height: 60,
  },
});
