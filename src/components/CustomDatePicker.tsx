import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import { useApp } from '../store/AppContext';

interface CustomDatePickerProps {
  visible: boolean;
  value: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  // Track the viewed month/year in the calendar calendar state
  const [currentDate, setCurrentDate] = useState(new Date(value));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generate grid
  const daysArray: (number | null)[] = [];
  // Padding for first day index
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Fill month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }
  // Pad the grid to always represent exactly 6 rows (42 cells total) to prevent height adjustments (jittering)
  while (daysArray.length < 42) {
    daysArray.push(null);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day, 12, 0, 0); // set to mid-day to avoid timezone offsets
    onSelect(selected);
    onClose();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable 
          style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff', 
              borderColor: colors.border 
            }
          ]} 
          onPress={e => e.stopPropagation()}
        >
          {/* Calendar Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <FontAwesome name="chevron-left" size={14} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <FontAwesome name="chevron-right" size={14} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekLabelsRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, index) => (
              <Text key={index} style={[styles.weekLabelText, { color: colors.textMuted }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {daysArray.map((day, idx) => {
              if (day === null) {
                return <View key={idx} style={styles.dayCellEmpty} />;
              }

              const isSelected = 
                value.getDate() === day &&
                value.getMonth() === month &&
                value.getFullYear() === year;

              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectDay(day)}
                  style={[
                    styles.dayCell,
                    isToday && { borderColor: colors.primary, borderWidth: 1.5 },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text },
                      isSelected && { color: isDark ? '#1000a9' : '#ffffff', fontWeight: '800' }
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  navBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekLabelText: {
    width: 36,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 36,
    height: 36,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellEmpty: {
    width: 36,
    height: 36,
    margin: 2,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
});
