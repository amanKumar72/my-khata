import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TestStyleSheetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#908fa0" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>StyleSheet Test</Text>
          <Text style={styles.headerSubtitle}>Luminous Ledger Aesthetics</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>PREMIUM STYLESHEET DEMO</Text>

        {/* Financial Metrics Cards */}
        <View style={styles.row}>
          <View style={[styles.card, styles.receivableCard]}>
            <Text style={styles.cardMutedLabel}>You will get</Text>
            <Text style={[styles.cardValue, styles.emeraldText]}>₹4,82,900</Text>
            <Text style={styles.cardSubText}>Across 12 Customers</Text>
          </View>

          <View style={[styles.card, styles.payableCard]}>
            <Text style={styles.cardMutedLabel}>You will give</Text>
            <Text style={[styles.cardValue, styles.coralText]}>₹1,12,050</Text>
            <Text style={styles.cardSubText}>To 5 Suppliers</Text>
          </View>
        </View>

        {/* Cashflow overview */}
        <View style={styles.flatCard}>
          <Text style={styles.flatCardHeader}>Today's Cashflow Summary</Text>
          <View style={styles.cashflowRow}>
            <View style={styles.cashflowCol}>
              <Text style={styles.cashflowLabel}>Cash In</Text>
              <Text style={[styles.cashflowValue, styles.emeraldText]}>+₹12,400</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cashflowCol}>
              <Text style={styles.cashflowLabel}>Cash Out</Text>
              <Text style={[styles.cashflowValue, styles.coralText]}>-₹4,200</Text>
            </View>
          </View>
        </View>

        {/* Buttons Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-down-sharp" size={14} color="#ffffff" />
              <Text style={styles.primaryButtonText}>GIVE CREDIT</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.successButton]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up-sharp" size={14} color="#ffffff" />
              <Text style={styles.successButtonText}>GET PAYMENT</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent timeline items list */}
        <Text style={[styles.sectionTitle, styles.marginTop]}>RECENT LEDGER ENTRIES</Text>

        <View style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>R</Text>
            </View>
            <View>
              <Text style={styles.timelineName}>Rahul Sharma</Text>
              <Text style={styles.timelineMeta}>CUSTOMER • 10:45 AM</Text>
            </View>
          </View>
          <View style={styles.timelineRight}>
            <Text style={[styles.timelineAmount, styles.emeraldText]}>+₹15,000</Text>
            <Text style={styles.timelineDate}>TODAY</Text>
          </View>
        </View>

        <View style={styles.timelineItem}>
          <View style={styles.timelineLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <View>
              <Text style={styles.timelineName}>Global Electrics Ltd</Text>
              <Text style={styles.timelineMeta}>SUPPLIER • 09:12 AM</Text>
            </View>
          </View>
          <View style={styles.timelineRight}>
            <Text style={[styles.timelineAmount, styles.coralText]}>-₹45,200</Text>
            <Text style={styles.timelineDate}>TODAY</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.backToHomeButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="arrow-back" size={14} color="#c0c1ff" />
            <Text style={styles.backToHomeText}>Back to Main Dashboard</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: '#131313',
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  backText: {
    fontSize: 22,
    color: '#908fa0',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#908fa0',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#908fa0',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  marginTop: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
  },
  receivableCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  payableCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#f43f5e',
  },
  cardMutedLabel: {
    fontSize: 11,
    color: '#908fa0',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 10,
    color: '#908fa0',
  },
  emeraldText: {
    color: '#4edea3',
  },
  coralText: {
    color: '#ffb2b7',
  },
  flatCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 20,
  },
  flatCardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e5e2e1',
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
    fontSize: 11,
    color: '#908fa0',
    marginBottom: 2,
  },
  cashflowValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#262626',
    marginHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ff516a',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  successButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    marginBottom: 8,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  timelineName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e5e2e1',
  },
  timelineMeta: {
    fontSize: 9,
    color: '#908fa0',
    marginTop: 2,
  },
  timelineRight: {
    alignItems: 'flex-end',
  },
  timelineAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  timelineDate: {
    fontSize: 9,
    color: '#908fa0',
    marginTop: 2,
  },
  backToHomeButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#353534',
    alignItems: 'center',
    backgroundColor: '#131313',
  },
  backToHomeText: {
    color: '#c0c1ff',
    fontWeight: '700',
    fontSize: 13,
  },
});
