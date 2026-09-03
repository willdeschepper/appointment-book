//EventViewModal.tsx
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventViewModalProps } from '../types';

export const EventViewModal: React.FC<EventViewModalProps> = ({
  visible,
  event,
  onClose,
  onEdit,
  timeFormat,
  theme,
}) => {
  if (!event) return null;

  const handleEdit = () => {
    onEdit(event);
  };

  const formatDuration = () => {
    const start = event.startTime;
    const end = event.endTime;
    
    const startParts = start.replace(/[^\d:]/g, '').split(':');
    const endParts = end.replace(/[^\d:]/g, '').split(':');
    
    let startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || '0');
    let endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || '0');
    
    if (start.includes('PM') && !start.includes('12')) startMinutes += 12 * 60;
    if (end.includes('PM') && !end.includes('12')) endMinutes += 12 * 60;
    if (start.includes('AM') && start.includes('12')) startMinutes -= 12 * 60;
    if (end.includes('AM') && end.includes('12')) endMinutes -= 12 * 60;
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: theme.timeTextColor }]}>Close</Text>
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.headerTextColor }]}>Event Details</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Text style={[styles.editText, { color: theme.saveButtonColor }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[
            styles.eventPreview,
            { 
              backgroundColor: event.color || theme.timeColumnBackgroundColor,
              borderColor: theme.gridLineColor,
            }
          ]}>
            <Text style={[
              styles.eventTitle,
              { color: event.textColor || theme.headerTextColor }
            ]}>
              {event.title}
            </Text>
            
            <View style={styles.timeContainer}>
              <Text style={[
                styles.eventTime,
                { color: event.textColor || theme.headerTextColor }
              ]}>
                🕐 {event.startTime} - {event.endTime}
              </Text>
              
              <Text style={[
                styles.eventDuration,
                { color: event.textColor || theme.timeTextColor }
              ]}>
                Duration: {formatDuration()}
              </Text>
            </View>
            
            {event.category && (
              <View style={styles.categoryContainer}>
                <Text style={[
                  styles.eventCategory,
                  { color: event.textColor || theme.headerTextColor }
                ]}>
                  📁 {event.category}
                </Text>
              </View>
            )}
          </View>

          <View style={[
            styles.detailsSection,
            { 
              backgroundColor: theme.headerBackgroundColor,
              borderColor: theme.gridLineColor,
            }
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.headerTextColor }]}>
              Event Information
            </Text>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.timeTextColor }]}>Title:</Text>
              <Text style={[styles.detailValue, { color: theme.headerTextColor }]}>{event.title}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.timeTextColor }]}>Time:</Text>
              <Text style={[styles.detailValue, { color: theme.headerTextColor }]}>
                {event.startTime} - {event.endTime}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.timeTextColor }]}>Duration:</Text>
              <Text style={[styles.detailValue, { color: theme.headerTextColor }]}>
                {formatDuration()}
              </Text>
            </View>
            
            {event.description && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.timeTextColor }]}>Description:</Text>
                <Text style={[styles.detailValue, { color: theme.headerTextColor }]}>
                  {event.description}
                </Text>
              </View>
            )}
            
            {event.category && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.timeTextColor }]}>Category:</Text>
                <Text style={[styles.detailValue, { color: theme.headerTextColor }]}>
                  {event.category}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  closeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  eventPreview: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 28,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTime: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  eventDuration: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  categoryContainer: {
    alignItems: 'center',
  },
  eventCategory: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  detailsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    width: 90,
    marginRight: 12,
  },
  detailValue: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 40,
  },
});