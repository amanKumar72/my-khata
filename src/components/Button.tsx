import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Colors } from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style = {},
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const getButtonStyles = () => {
    const base: any[] = [styles.button];
    if (variant === 'primary') {
      base.push(styles.primaryButton);
      if (isDark) {
        base.push({ backgroundColor: '#c0c1ff' });
      } else {
        base.push({ backgroundColor: '#4f46e5' });
      }
    } else if (variant === 'secondary') {
      base.push(styles.secondaryButton);
      base.push({ backgroundColor: colors.surface, borderColor: colors.border });
    } else if (variant === 'ghost') {
      base.push(styles.ghostButton);
    }

    if (disabled || loading) {
      base.push(styles.disabled);
    }
    return base;
  };

  const getTextStyles = () => {
    const base: any[] = [styles.text];
    if (variant === 'primary') {
      if (isDark) {
        base.push({ color: '#1000a9' });
      } else {
        base.push({ color: '#ffffff' });
      }
    } else if (variant === 'secondary') {
      base.push({ color: colors.text });
    } else if (variant === 'ghost') {
      base.push({ color: colors.textMuted });
    }
    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator color={isDark && variant === 'primary' ? '#1000a9' : '#fff'} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyles()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryButton: {
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
