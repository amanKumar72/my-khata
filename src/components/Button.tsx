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

  // Dynamically calculate the text color based on the actual background color (including overrides)
  const flattenedStyle = StyleSheet.flatten([getButtonStyles(), style]) || {};
  const finalBgColor = flattenedStyle.backgroundColor;

  const isLightColor = (color: string) => {
    if (!color) return false;
    const hex = color.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return false;
    }
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150;
  };

  const getTextColor = () => {
    if (variant === 'primary') {
      return isLightColor(finalBgColor) ? '#000000' : '#ffffff';
    } else if (variant === 'secondary') {
      return colors.text;
    } else if (variant === 'ghost') {
      return colors.textMuted;
    }
    return colors.text;
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
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
