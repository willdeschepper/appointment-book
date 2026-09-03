//EventFormModal.tsx
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventFormProps, ScheduleItem } from '../types';
import { formatTime, parseTime } from '../utils/timeHelpers';

export const EventFormModal: React.FC<EventFormProps> = ({
  visible,
  hour,
  timeFormat,
  initialStartTime,
  initialEndTime,
  existingEvent,
  onSave,
  onCancel,
  onClear,
  theme,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(theme.eventColorOptions[0]);
  const [category, setCategory] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startHour, setStartHour] = useState(hour);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(hour);
  const [endMinute, setEndMinute] = useState(15);

  useEffect(() => {
    setStartTime(formatTime(startHour, startMinute, timeFormat));
  }, [startHour, startMinute, timeFormat]);

  useEffect(() => {
    setEndTime(formatTime(endHour, endMinute, timeFormat));
  }, [endHour, endMinute, timeFormat]);

  useEffect(() => {
    if (!existingEvent && theme.eventColorOptions.length > 0) {
      const isCurrentColorInTheme = theme.eventColorOptions.some(
        color => color.value === selectedColor.value
      );
      
      if (!isCurrentColorInTheme) {
        setSelectedColor(theme.eventColorOptions[0]);
      }
    }
  }, [theme.eventColorOptions, existingEvent]);

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || '');
      setCategory(existingEvent.category || '');
      
      const start = parseTime(existingEvent.startTime);
      const end = parseTime(existingEvent.endTime);
      
      setStartHour(start.hour);
      setStartMinute(start.minute);
      setEndHour(end.hour);
      setEndMinute(end.minute);
      
      const matchingColor = theme.eventColorOptions.find(
        color => color.value === existingEvent.color
      );
      setSelectedColor(matchingColor || theme.eventColorOptions[0]);
    } else if (initialStartTime && initialEndTime) {
      const start = parseTime(initialStartTime);
      const end = parseTime(initialEndTime);
      
      setStartHour(start.hour);
      setStartMinute(start.minute);
      setEndHour(end.hour);
      setEndMinute(end.minute);
      
      setTitle('');
      setDescription('');
      setCategory('');
      setSelectedColor(theme.eventColorOptions[0]);
    }
  }, [existingEvent, initialStartTime, initialEndTime, visible, theme.eventColorOptions]);

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      setStartHour(selectedDate.getHours());
      setStartMinute(selectedDate.getMinutes());
    }
    
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowStartPicker(false);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    
    if (selectedDate && event.type !== 'dismissed') {
      setEndHour(selectedDate.getHours());
      setEndMinute(selectedDate.getMinutes());
    }
    
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowEndPicker(false);
    }
  };

  const getStartDate = () => {
    const date = new Date();
    date.setHours(startHour, startMinute, 0, 0);
    return date;
  };

  const getEndDate = () => {
    const date = new Date();
    date.setHours(endHour, endMinute, 0, 0);
    return date;
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    const startValue = startHour * 60 + startMinute;
    const endValue = endHour * 60 + endMinute;
    
    if (startValue >= endValue) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    if (endValue - startValue < 5) {
      Alert.alert('Error', 'Event must be at least 5 minutes long');
      return;
    }

    const eventData: Omit<ScheduleItem, 'id'> = {
      startTime: startTime,
      endTime: endTime,
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      color: selectedColor.value,
      textColor: selectedColor.textColor,
    };

    onSave(eventData, startTime, endTime);
  };

  const handleClear = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (onClear) {
              onClear();
            } else {
              onCancel();
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
            <Text style={[styles.cancelText, { color: theme.cancelButtonColor }]}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.headerTextColor }]}>
              {existingEvent ? 'Edit Event' : 'New Event'}
            </Text>
            <Text style={[styles.timeRange, { color: theme.timeTextColor }]}>
              {startTime} - {endTime}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Text style={[styles.saveText, { color: theme.saveButtonColor }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Title *</Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.eventAreaBackgroundColor,
                  borderColor: theme.gridLineColor,
                  color: theme.headerTextColor,
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter event title"
              placeholderTextColor={theme.timeTextColor}
              maxLength={50}
              returnKeyType="next"
              autoFocus={!existingEvent}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Time</Text>
            
            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.timeTextColor }]}>Start:</Text>
              <TouchableOpacity 
                style={[
                  styles.timeButton,
                  { 
                    backgroundColor: theme.eventAreaBackgroundColor,
                    borderColor: theme.gridLineColor,
                  }
                ]}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={[styles.timeButtonText, { color: theme.headerTextColor }]}>
                  {startTime}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeRow}>
              <Text style={[styles.timeLabel, { color: theme.timeTextColor }]}>End:</Text>
              <TouchableOpacity 
                style={[
                  styles.timeButton,
                  { 
                    backgroundColor: theme.eventAreaBackgroundColor,
                    borderColor: theme.gridLineColor,
                  }
                ]}
                onPress={() => setShowEndPicker(true)}
              >
                <Text style={[styles.timeButtonText, { color: theme.headerTextColor }]}>
                  {endTime}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Description</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
                { 
                  backgroundColor: theme.eventAreaBackgroundColor,
                  borderColor: theme.gridLineColor,
                  color: theme.headerTextColor,
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description (optional)"
              placeholderTextColor={theme.timeTextColor}
              multiline
              numberOfLines={3}
              maxLength={200}
              returnKeyType="done"
              textAlignVertical="top"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Category</Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.eventAreaBackgroundColor,
                  borderColor: theme.gridLineColor,
                  color: theme.headerTextColor,
                }
              ]}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Work, Personal, Meeting"
              placeholderTextColor={theme.timeTextColor}
              maxLength={30}
              returnKeyType="done"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Color</Text>
            <View style={styles.colorGrid}>
              {theme.eventColorOptions.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    selectedColor.value === color.value && {
                      borderColor: theme.arrowColor,
                      borderWidth: 3,
                    }
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  <View style={styles.colorContent}>
                    <Text style={[styles.colorName, { color: color.textColor }]}>
                      {color.name}
                    </Text>
                    {selectedColor.value === color.value && (
                      <Text style={[styles.checkmark, { color: color.textColor }]}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.headerTextColor }]}>Preview</Text>
            <View style={[
              styles.preview,
              { 
                backgroundColor: selectedColor.value,
                borderColor: theme.gridLineColor,
              }
            ]}>
              <Text style={[
                styles.previewTitle,
                { color: selectedColor.textColor }
              ]}>
                {title || 'Event Title'}
              </Text>
              {description && (
                <Text style={[
                  styles.previewDescription,
                  { color: selectedColor.textColor }
                ]}>
                  {description}
                </Text>
              )}
              {category && (
                <Text style={[
                  styles.previewCategory,
                  { color: selectedColor.textColor }
                ]}>
                  📁 {category}
                </Text>
              )}
              <Text style={[
                styles.previewTime,
                { color: selectedColor.textColor }
              ]}>
                🕐 {startTime} - {endTime}
              </Text>
            </View>
          </View>

          {existingEvent && onClear && (
            <View style={styles.fieldContainer}>
              <TouchableOpacity
                style={[styles.clearButton, { backgroundColor: `${theme.cancelButtonColor}20` }]}
                onPress={handleClear}
              >
                <Text style={[styles.clearButtonText, { color: theme.cancelButtonColor }]}>
                  Delete Event
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {showStartPicker && (
          <DateTimePicker
            value={getStartDate()}
            mode="time"
            is24Hour={timeFormat === '24'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartTimeChange}
            style={Platform.OS === 'ios' ? { backgroundColor: theme.backgroundColor } : undefined}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={getEndDate()}
            mode="time"
            is24Hour={timeFormat === '24'}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndTimeChange}
            style={Platform.OS === 'ios' ? { backgroundColor: theme.backgroundColor } : undefined}
          />
        )}

        {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
          <View style={styles.pickerDoneContainer}>
            <TouchableOpacity
              style={[styles.pickerDoneButton, { backgroundColor: theme.saveButtonColor }]}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(false);
              }}
            >
              <Text style={[styles.pickerDoneText, { color: theme.fabIconColor }]}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeRange: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 60,
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '22%',
    aspectRatio: 1.2,
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  preview: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewDescription: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
    lineHeight: 20,
  },
  previewCategory: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
    opacity: 0.8,
  },
  previewTime: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
  pickerDoneContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    paddingBottom: 40,
  },
  pickerDoneButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});