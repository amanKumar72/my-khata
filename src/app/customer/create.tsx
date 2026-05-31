import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../store/AppContext';
import { customerRepo } from '../../repositories/customerRepo';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';

export default function CreateCustomerScreen() {
  const router = useRouter();
  const { theme, selectedStoreId } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSave = async () => {
    if (!name.trim()) {
      setErrors({ name: 'Customer name is required' });
      return;
    }

    try {
      setLoading(true);
      const customer = await customerRepo.create(
        selectedStoreId,
        name.trim(),
        phone.trim(),
        address.trim()
      );
      
      Toast.show({
        type: 'success',
        text1: 'Customer Created',
        text2: `${customer.name} has been added successfully`,
      });
      
      router.back();
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create customer',
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
          <Text style={[styles.backText, { color: colors.textMuted }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add New Customer
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.card}>
          <Input
            label="Customer Name *"
            value={name}
            onChangeText={(val) => {
              setName(val);
              setErrors({});
            }}
            placeholder="e.g. Rahul Sharma"
            error={errors.name}
            autoFocus
          />
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
          />
          <Input
            label="Home / Shop Address"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Sector 12, Block A"
            multiline
            numberOfLines={3}
            style={styles.addressArea}
          />
        </Card>

        <Button
          title="Save Customer Ledger"
          onPress={handleSave}
          loading={loading}
          style={styles.saveBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Local Card styled helper
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
  card: {
    padding: 24,
    marginBottom: 24,
  },
  addressArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    paddingVertical: 14,
  },
  localCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
