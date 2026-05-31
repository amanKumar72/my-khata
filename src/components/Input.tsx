import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Colors } from '../constants/Colors';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  style?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style = {},
  ...props
}) => {
  const { theme } = useApp();
  const [isFocused, setIsFocused] = useState(false);
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark ? '#171717' : '#f8fafc',
            borderColor: error
              ? '#ef4444'
              : isFocused
              ? isDark
                ? '#c0c1ff'
                : '#4f46e5'
              : colors.border,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={isDark ? '#464554' : '#94a3b8'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 13,
    borderWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});
