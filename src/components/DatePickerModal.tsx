//DatePickerModal.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModalProps } from '../types';

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  currentDate,
  today,
  onDateSelect,
  onCancel,
  theme,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const [year, month, day] = currentDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  React.useEffect(() => {
    if (visible) {
      const [year, month, day] = currentDate.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  }, [currentDate, visible]);

  React.useEffect(() => {
    if (visible) {
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  }, [visible]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      
      if (event.type === 'set' && date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        onDateSelect(dateString);
      } else {
        onCancel();
      }
    } else {
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleConfirm = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onDateSelect(dateString);
  };

  const handleToday = () => {
    onDateSelect(today);
  };

  const formatDisplayDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  if (Platform.OS === 'android') {
    return (
      <>
        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: theme.cancelButtonColor }]}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.headerTextColor }]}>Select Date</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleToday}>
            <Text style={[styles.todayText, { color: theme.saveButtonColor }]}>Today</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.selectedDateContainer, { backgroundColor: theme.headerBackgroundColor }]}>
          <Text style={[styles.selectedDateText, { color: theme.headerTextColor }]}>
            Selected Date
          </Text>
          <Text style={[styles.selectedDateValue, { color: theme.arrowColor }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
        </View>

        <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundColor }]}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            style={[styles.picker, { backgroundColor: theme.backgroundColor }]}
            minimumDate={new Date(2000, 0, 1)}
            maximumDate={new Date(2050, 11, 31)}
          />
        </View>

        <View style={[styles.quickActionsContainer, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: theme.gridLineColor }]}
            onPress={() => {
              const yesterday = new Date(selectedDate);
              yesterday.setDate(yesterday.getDate() - 1);
              setSelectedDate(yesterday);
            }}
          >
            <Text style={[styles.quickActionText, { color: theme.timeTextColor }]}>Yesterday</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: theme.gridLineColor }]}
            onPress={() => {
              const [year, month, day] = today.split('-').map(Number);
              setSelectedDate(new Date(year, month - 1, day));
            }}
          >
            <Text style={[styles.quickActionText, { color: theme.arrowColor }]}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: theme.gridLineColor }]}
            onPress={() => {
              const tomorrow = new Date(selectedDate);
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(tomorrow);
            }}
          >
            <Text style={[styles.quickActionText, { color: theme.timeTextColor }]}>Tomorrow</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.confirmContainer, { backgroundColor: theme.backgroundColor }]}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.saveButtonColor }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.confirmButtonText, { color: theme.fabIconColor }]}>
              Select Date
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  todayText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedDateContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  selectedDateValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  picker: {
    width: '100%',
    height: 200,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#e9ecef',
    borderBottomColor: '#e9ecef',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmContainer: {
    padding: 20,
  },
  confirmButton: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});