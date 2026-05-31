import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useApp } from '../store/AppContext';
import { Colors } from '../constants/Colors';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, style = {}, ...props }) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border 
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
