import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Colors } from '../constants/Colors';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  iconName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onActionPress,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1e1e1e' : '#f1f5f9' }]}>
        <Text style={styles.icon}>📦</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      {actionTitle && onActionPress ? (
        <Button title={actionTitle} onPress={onActionPress} style={styles.btn} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  btn: {
    paddingHorizontal: 20,
  },
});
