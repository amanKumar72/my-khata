import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { backupService } from '../../services/backupService';
import { exportService } from '../../services/exportService';
import { customerRepo } from '../../repositories/customerRepo';
import { supplierRepo } from '../../repositories/supplierRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { transactionRepo } from '../../repositories/transactionRepo';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    theme,
    toggleTheme,
    currency,
    changeCurrency,
    hasPin,
    setPin,
    disablePin,
    selectedStoreId,
    loadStores,
  } = useApp();

  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Pin modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinActionType, setPinActionType] = useState<'create' | 'disable'>('create');

  // Restore modals
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [backupJsonStr, setBackupJsonStr] = useState('');
  
  // Local files backups
  const [localBackups, setLocalBackups] = useState<string[]>([]);
  const [filesModalVisible, setFilesModalVisible] = useState(false);

  const currencies = ['₹', '$', '€', '£', '¥', 'USD', 'INR'];

  const refreshLocalBackups = async () => {
    const list = await backupService.listLocalBackups();
    setLocalBackups(list);
  };

  useEffect(() => {
    refreshLocalBackups();
  }, []);

  const handleTogglePin = () => {
    if (hasPin) {
      setPinActionType('disable');
      setEnteredPin('');
      setPinModalVisible(true);
    } else {
      setPinActionType('create');
      setEnteredPin('');
      setPinModalVisible(true);
    }
  };

  const handleSavePin = async () => {
    if (enteredPin.length !== 4 || isNaN(parseInt(enteredPin))) {
      Toast.show({
        type: 'error',
        text1: 'PIN Error',
        text2: 'PIN must be a 4-digit number',
      });
      return;
    }

    try {
      if (pinActionType === 'create') {
        await setPin(enteredPin);
        Toast.show({
          type: 'success',
          text1: 'PIN Enabled',
          text2: 'App lock active on startup',
        });
      } else {
        await disablePin();
        Toast.show({
          type: 'info',
          text1: 'PIN Disabled',
          text2: 'App lock has been disabled',
        });
      }
      setPinModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const filename = await backupService.createBackup();
      Toast.show({
        type: 'success',
        text1: 'Backup Complete',
        text2: `Saved backup as: ${filename}`,
      });
      refreshLocalBackups();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Backup Failed',
        text2: 'Failed to write backup file',
      });
    }
  };

  const handleCopyBackup = async () => {
    try {
      await backupService.copyBackupToClipboard();
      Toast.show({
        type: 'success',
        text1: 'Copied',
        text2: 'Backup JSON copied to clipboard',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Clipboard copy failed',
      });
    }
  };

  const handleRestoreFromPaste = async () => {
    if (!backupJsonStr.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Restore Error',
        text2: 'Please paste the backup JSON string',
      });
      return;
    }

    Alert.alert(
      'Confirm Restore',
      'This will wipe all existing store and ledger data and replace it with the backup content. This action is irreversible!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await backupService.restoreBackup(backupJsonStr.trim(), true);
              setRestoreModalVisible(false);
              setBackupJsonStr('');
              await loadStores();
              Toast.show({
                type: 'success',
                text1: 'Restore Successful',
                text2: 'Ledger databases restored, reloading...',
              });
              router.replace('/(tabs)');
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Restore Failed',
                text2: 'Invalid backup file structure or syntax',
              });
            }
          }
        }
      ]
    );
  };

  const handleRestoreFromFile = (filename: string) => {
    Alert.alert(
      'Confirm Restore',
      `Restore from backup file: ${filename}? Existing records will be overwritten!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              await backupService.restoreBackup(filename, false);
              setFilesModalVisible(false);
              await loadStores();
              Toast.show({
                type: 'success',
                text1: 'Restore Successful',
                text2: 'State loaded successfully',
              });
              router.replace('/(tabs)');
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Restore Failed',
                text2: 'Failed to read file or structure is invalid',
              });
            }
          }
        }
      ]
    );
  };

  const handleExportAllCSVs = async () => {
    if (!selectedStoreId) return;
    try {
      const customers = await customerRepo.getAll(selectedStoreId);
      const suppliers = await supplierRepo.getAll(selectedStoreId);
      const expenses = await expenseRepo.getAll(selectedStoreId);
      const transactions = await transactionRepo.getAll(selectedStoreId);

      await exportService.exportCustomersToCSV(customers, currency);
      await exportService.exportSuppliersToCSV(suppliers, currency);
      await exportService.exportExpensesToCSV(expenses);
      await exportService.exportTransactionsToCSV(transactions);

      Toast.show({
        type: 'success',
        text1: 'Export Complete',
        text2: 'Generated CSV sheets for all databases',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Failed to generate files',
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View style={[styles.header, { backgroundColor: isDark ? '#131313' : '#ffffff', borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          App Configuration
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Currency setting */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Base Currency Symbol
          </Text>
          <View style={styles.currencyGrid}>
            {currencies.map((sym) => {
              const isSelected = currency === sym;
              return (
                <TouchableOpacity
                  key={sym}
                  onPress={() => changeCurrency(sym)}
                  style={[
                    styles.currencyBtn,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9',
                      borderColor: isSelected ? colors.primary : isDark ? '#353534' : '#cbd5e1',
                    },
                    isSelected && { borderWidth: 2 }
                  ]}
                >
                  <Text style={[styles.currencyBtnText, { color: isSelected ? colors.primary : colors.text }]}>{sym}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Theme and PIN security */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Display & Security Settings
          </Text>

          {/* Toggle Theme Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleTheme}
            style={styles.settingRow}
          >
            <View>
              <Text style={[styles.settingRowTitle, { color: colors.text }]}>
                App Theme Styling
              </Text>
              <Text style={[styles.settingRowDesc, { color: colors.textMuted }]}>
                Current Mode: {isDark ? 'Luminous Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

          {/* Manage PIN Lock Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTogglePin}
            style={styles.settingRow}
          >
            <View>
              <Text style={[styles.settingRowTitle, { color: colors.text }]}>
                Startup Security PIN Lock
              </Text>
              <Text style={[styles.settingRowDesc, { color: colors.textMuted }]}>
                Status: {hasPin ? 'Active Lock Secure' : 'Disabled / Vulnerable'}
              </Text>
            </View>
            <Ionicons name={hasPin ? "lock-closed" : "lock-open"} size={20} color={colors.primary} />
          </TouchableOpacity>
        </Card>

        {/* Exports & Backups */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Database Backups & Exports
          </Text>

          <Button
            title="Export All Tables to CSV Sheet"
            variant="secondary"
            onPress={handleExportAllCSVs}
            style={styles.actionBtn}
          />

          <View style={styles.btnGroupRow}>
            <Button
              title="Generate JSON Backup"
              onPress={handleCreateBackup}
              style={styles.flexBtn}
            />
            <Button
              title="Copy JSON Backup"
              variant="secondary"
              onPress={handleCopyBackup}
              style={styles.flexBtn}
            />
          </View>

          <View style={styles.btnGroupRow}>
            <Button
              title="Scan Local Backups"
              variant="secondary"
              onPress={() => {
                refreshLocalBackups();
                setFilesModalVisible(true);
              }}
              style={styles.flexBtn}
            />
            <Button
              title="Paste JSON Restore"
              variant="secondary"
              onPress={() => setRestoreModalVisible(true)}
              style={styles.flexBtn}
            />
          </View>
        </Card>

        {/* About App Card */}
        <Card style={styles.aboutCard}>
          <Text style={[styles.aboutTitle, { color: colors.text }]}>
            My Khata Ledger App v1.0.0
          </Text>
          <Text style={[styles.aboutText, { color: colors.textMuted }]}>
            A production-ready offline business ledger engineered with SQLite transaction schemas, SecureStore crypts, and StyleSheet layouts. Made for small shops, personal accounts, and freelancers.
          </Text>
        </Card>
        <View style={styles.bottomGap} />
      </ScrollView>

      {/* Modal to Set/Disable PIN */}
      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setPinModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.smallModal, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {pinActionType === 'create' ? 'Create 4-Digit Security PIN' : 'Enter PIN to Disable App Lock'}
            </Text>
            
            <Input
              label="Enter 4-Digit PIN Number"
              value={enteredPin}
              onChangeText={setEnteredPin}
              placeholder="e.g. 1234"
              maxLength={4}
              keyboardType="numeric"
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setPinModalVisible(false)}
                style={styles.flexBtn}
              />
              <Button
                title={pinActionType === 'create' ? 'Enable' : 'Disable'}
                onPress={handleSavePin}
                style={styles.flexBtn}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal to Paste JSON backup */}
      <Modal
        visible={restoreModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRestoreModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setRestoreModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.mediumModal, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 4 }]}>
              Paste JSON Backup Data
            </Text>
            <Text style={[styles.modalDesc, { color: colors.textMuted }]}>
              Warning: This will wipe all current store, ledger, and cashflow details completely!
            </Text>
            
            <Input
              label="Backup JSON Content *"
              value={backupJsonStr}
              onChangeText={setBackupJsonStr}
              placeholder='{"version": 1, ...}'
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={styles.textArea}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setRestoreModalVisible(false)}
                style={styles.flexBtn}
              />
              <Button
                title="RESTORE NOW"
                onPress={handleRestoreFromPaste}
                style={[styles.flexBtn, { backgroundColor: '#ef4444' }]}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal to select a local Backup file */}
      <Modal
        visible={filesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilesModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.bottomBackdrop}
          onPress={() => setFilesModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.bottomSheet, { backgroundColor: isDark ? '#131313' : '#f8fafc', borderTopColor: colors.border }]}
          >
            <View style={[styles.sheetNotch, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Select Local SQLite Backup File
              </Text>
              <TouchableOpacity onPress={() => setFilesModalVisible(false)}>
                <Text style={[styles.closeText, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            {localBackups.length === 0 ? (
              <View style={styles.emptyFiles}>
                <FontAwesome5 name="folder-open" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No local JSON backup files scanned.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.sheetScroll}>
                {localBackups.map((filename) => (
                  <TouchableOpacity
                    key={filename}
                    onPress={() => handleRestoreFromFile(filename)}
                    style={[
                      styles.backupItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      }
                    ]}
                  >
                    <View style={styles.backupItemLeft}>
                      <Text style={[styles.backupName, { color: colors.text }]} numberOfLines={1}>
                        {filename}
                      </Text>
                    </View>
                    <Ionicons name="download-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
    height: 64,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingRowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingRowDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  settingRowIcon: {
    fontSize: 18,
  },
  innerDivider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 12,
    marginBottom: 12,
  },
  btnGroupRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  flexBtn: {
    flex: 1,
  },
  aboutCard: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 11,
    lineHeight: 18,
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
  mediumModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  modalDesc: {
    fontSize: 10,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  bottomBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
  closeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyFiles: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  sheetScroll: {
    maxHeight: 300,
  },
  backupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  backupItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  backupName: {
    fontSize: 11,
    fontWeight: '700',
  },
  backupIcon: {
    fontSize: 14,
  },
});
