import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface StoreSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export const StoreSwitcher: React.FC<StoreSwitcherProps> = ({ visible, onClose }) => {
  const {
    theme,
    stores,
    selectedStoreId,
    selectStore,
    createStore,
    updateStore,
    deleteStore,
  } = useApp();

  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSelect = async (id: string) => {
    await selectStore(id);
    Toast.show({
      type: 'success',
      text1: 'Store Switched',
      text2: `Welcome to ${stores.find(s => s.id === id)?.name}`,
    });
    onClose();
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Store name is required',
      });
      return;
    }
    
    try {
      const store = await createStore(name.trim(), phone.trim(), address.trim());
      setIsAdding(false);
      resetForm();
      Toast.show({
        type: 'success',
        text1: 'Store Created',
        text2: `Successfully loaded ${store.name}`,
      });
      onClose();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create store',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!isEditing) return;
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Store name is required',
      });
      return;
    }

    try {
      await updateStore(isEditing, name.trim(), phone.trim(), address.trim());
      setIsEditing(null);
      resetForm();
      Toast.show({
        type: 'success',
        text1: 'Store Updated',
        text2: 'Changes saved successfully',
      });
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update store',
      });
    }
  };

  const handleDelete = async (id: string, storeName: string) => {
    if (stores.length <= 1) {
      Toast.show({
        type: 'error',
        text1: 'Action Denied',
        text2: 'You must have at least one store',
      });
      return;
    }

    try {
      await deleteStore(id);
      setIsEditing(null);
      resetForm();
      Toast.show({
        type: 'info',
        text1: 'Store Deleted',
        text2: `${storeName} has been deleted`,
      });
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete store',
      });
    }
  };

  const startEdit = (store: any) => {
    setIsEditing(store.id);
    setName(store.name);
    setPhone(store.phone || '');
    setAddress(store.address || '');
  };

  const startAdd = () => {
    setIsAdding(true);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
  };

  const cancelSubFlow = () => {
    setIsAdding(false);
    setIsEditing(null);
    resetForm();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalBackdrop}
        onPress={() => {
          if (!isAdding && !isEditing) onClose();
        }}
      >
        <Pressable 
          style={[styles.modalSheet, { backgroundColor: isDark ? '#131313' : '#f8fafc' }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.notch, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />

          {isAdding || isEditing ? (
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {isAdding ? 'Create New Store' : 'Edit Store Details'}
              </Text>
              
              <Input
                label="Store/Business Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Modern Electronics"
                autoFocus
              />
              <Input
                label="Contact Phone (Optional)"
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +91 9876543210"
                keyboardType="phone-pad"
              />
              <Input
                label="Store Address (Optional)"
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. Local Market, Floor 1"
                multiline
              />

              <View style={styles.btnRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={cancelSubFlow}
                  style={styles.flexBtn}
                />
                <Button
                  title={isAdding ? 'Create' : 'Save'}
                  onPress={isAdding ? handleAdd : handleSaveEdit}
                  style={styles.flexBtn}
                />
              </View>

              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(isEditing, stores.find(s => s.id === isEditing)?.name || '')}
                >
                  <Text style={styles.deleteBtnText}>Delete Store & All Data</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text, marginBottom: 0 }]}>
                  Switch Business Store
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollList}>
                {stores.map((store) => {
                  const isActive = store.id === selectedStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(store.id)}
                      style={[
                        styles.storeItem,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isActive ? colors.primary : colors.border
                        }
                      ]}
                    >
                      <View style={styles.storeLeft}>
                        <View style={[styles.avatar, { backgroundColor: isActive ? '#c0c1ff30' : '#e2e8f050' }]}>
                          <FontAwesome5 name="store" size={14} color={isActive ? colors.primary : colors.textMuted} />
                        </View>
                        <View>
                          <Text style={[
                            styles.storeName,
                            { color: isActive ? colors.primary : colors.text }
                          ]}>
                            {store.name}
                          </Text>
                          {store.address ? (
                            <Text style={[styles.storeAddress, { color: colors.textMuted }]}>
                              {store.address}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      
                      <View style={styles.storeRight}>
                        {isActive && (
                          <View style={[styles.activeBadge, { backgroundColor: isDark ? '#c0c1ff20' : '#4f46e510' }]}>
                            <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                          </View>
                        )}
                        <TouchableOpacity 
                          onPress={(e) => {
                            e.stopPropagation();
                            startEdit(store);
                          }}
                          style={styles.editBtn}
                        >
                          <FontAwesome name="pencil" size={13} color={colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Button
                title="+ Create New Business Store"
                variant="secondary"
                onPress={startAdd}
                style={styles.createBtn}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 24,
  },
  notch: {
    width: 48,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  doneText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  flexBtn: {
    flex: 1,
  },
  deleteBtn: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollList: {
    maxHeight: 280,
    marginBottom: 20,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  storeAddress: {
    fontSize: 10,
    marginTop: 2,
  },
  storeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  editBtn: {
    padding: 4,
  },
  editBtnText: {
    fontSize: 12,
  },
  createBtn: {
    width: '100%',
    paddingVertical: 14,
  },
});
