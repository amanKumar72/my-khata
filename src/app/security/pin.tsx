import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';
import { useApp } from '../../store/AppContext';
import Toast from 'react-native-toast-message';
import { Colors } from '../../constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

export const PinLockScreen = () => {
  const { verifyPin, unlockApp, theme } = useApp();
  const [pin, setPin] = useState('');
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const handleKeyPress = async (val: string) => {
    if (pin.length >= 4) return;
    
    const newPin = pin + val;
    setPin(newPin);

    if (newPin.length === 4) {
      const isValid = await verifyPin(newPin);
      if (isValid) {
        unlockApp();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Incorrect PIN',
          text2: 'Please try again',
        });
        setTimeout(() => setPin(''), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <View style={styles.headerGroup}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.lockTitle, { color: colors.text }]}>
            Enter Security PIN
          </Text>
          <Text style={[styles.lockSubtitle, { color: colors.textMuted }]}>
            Secure Your My Khata Ledger
          </Text>
        </View>

        {/* PIN Dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  { borderColor: isDark ? '#3f3f46' : '#cbd5e1' },
                  isFilled && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((num) => (
                <TouchableOpacity
                  key={num}
                  activeOpacity={0.7}
                  onPress={() => handleKeyPress(num)}
                  style={[
                    styles.key,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                >
                  <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Bottom Row */}
          <View style={styles.keypadRow}>
            {/* Clear Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setPin('')}
              style={styles.controlKey}
            >
              <Text style={[styles.controlKeyText, { color: colors.textMuted }]}>CLEAR</Text>
            </TouchableOpacity>

            {/* Zero */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleKeyPress('0')}
              style={[
                styles.key,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }
              ]}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
            </TouchableOpacity>

            {/* Backspace */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDelete}
              style={styles.controlKey}
            >
              <Text style={[styles.backspaceIcon, { color: colors.primary }]}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  headerGroup: {
    alignItems: 'center',
    marginBottom: 40,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  key: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  keyText: {
    fontSize: 20,
    fontWeight: '700',
  },
  controlKey: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlKeyText: {
    fontSize: 10,
    fontWeight: '700',
  },
  backspaceIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PinLockScreen;
