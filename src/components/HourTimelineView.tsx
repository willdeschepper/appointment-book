//HourTimelineView.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HourDetailProps, ScheduleItem } from '../types';
import { calculateEventLayouts } from '../utils/eventLayout';
import {
  createEventId,
  formatTime,
  formatTimeFromMinutes,
  parseTime,
} from '../utils/timeHelpers';
import { EventFormModal } from './EventFormModal';
import { EventViewModal } from './EventViewModal';
import { FloatingEventBlock } from './FloatingEventBlock';

const TIME_LABEL_WIDTH = 80;

export const HourTimelineView: React.FC<HourDetailProps> = ({
  hour,
  date,
  events,
  onSave,
  onClose,
  timeFormat,
  theme
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const [editingEvents, setEditingEvents] = useState<ScheduleItem[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventView, setShowEventView] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleItem | undefined>();
  const [viewingEvent, setViewingEvent] = useState<ScheduleItem | undefined>();
  const [selectedTimeRange, setSelectedTimeRange] = useState({ startTime: '', endTime: '' });

  useEffect(() => {
    const eventsCopy = events.map(event => ({ ...event }));
    setEditingEvents(eventsCopy);
  }, [events, hour, date]);

  const handleTimelinePress = () => {
    const startTime = formatTime(hour, 0, timeFormat);
    const endTime = formatTime(hour, 15, timeFormat);
    
    setSelectedTimeRange({ startTime, endTime });
    setEditingEvent(undefined);
    setShowEventForm(true);
  };

  const handleSubRowPress = (startMinute: number, event: any) => {
    event.stopPropagation();
    
    const endMinute = Math.min(startMinute + 15, 60);
    
    const startTime = formatTimeFromMinutes(hour * 60 + startMinute, timeFormat);
    const endTime = formatTimeFromMinutes(hour * 60 + endMinute, timeFormat);
    
    setSelectedTimeRange({ startTime, endTime });
    setEditingEvent(undefined);
    setShowEventForm(true);
  };

  const handleEventPress = (event: ScheduleItem) => {
    setViewingEvent(event);
    setShowEventView(true);
  };

  const handleEventEditDirect = (event: ScheduleItem) => {
    setEditingEvent(event);
    setSelectedTimeRange({
      startTime: event.startTime,
      endTime: event.endTime
    });
    setShowEventForm(true);
  };

  const handleEventEdit = (event: ScheduleItem) => {
    setShowEventView(false);
    setEditingEvent(event);
    setSelectedTimeRange({
      startTime: event.startTime,
      endTime: event.endTime
    });
    setShowEventForm(true);
  };

  const handleEventSave = (eventData: Omit<ScheduleItem, 'id'>, startTime: string, endTime: string) => {
    let updatedEvents = [...editingEvents];

    if (editingEvent) {
      const eventIndex = updatedEvents.findIndex(e => e.id === editingEvent.id);
      
      if (eventIndex !== -1) {
        const newEvent: ScheduleItem = {
          ...eventData,
          id: editingEvent.id,
          startTime,
          endTime,
        };
        
        updatedEvents[eventIndex] = newEvent;
      } else {
        return;
      }
    } else {
      const newEvent: ScheduleItem = {
        ...eventData,
        id: createEventId(),
        startTime,
        endTime,
      };
      
      updatedEvents.push(newEvent);
    }

    updatedEvents.sort((a, b) => {
      const aStart = parseTime(a.startTime);
      const bStart = parseTime(b.startTime);
      return (aStart.hour * 60 + aStart.minute) - (bStart.hour * 60 + bStart.minute);
    });
  
    setEditingEvents(updatedEvents);
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleEventClear = () => {
    if (editingEvent) {
      const updatedEvents = editingEvents.filter(e => e.id !== editingEvent.id);
      setEditingEvents(updatedEvents);
    }
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleSave = () => {
    onSave(hour, editingEvents);
  };

  const eventLayouts = calculateEventLayouts(editingEvents, {
    pixelsPerHour: 480,
    startHour: hour,
    endHour: hour + 1,
    containerWidth: windowWidth,
    timeLabelWidth: TIME_LABEL_WIDTH,
    leftOffset: TIME_LABEL_WIDTH + 20,
    widthOffset: TIME_LABEL_WIDTH + 40,
    topOffset: 20,
    columnGap: 2,
  });

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.cancelButtonColor }]}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.headerTextColor }]}>
              {formatTime(hour, 0, timeFormat)} - {formatTimeFromMinutes((hour + 1) * 60, timeFormat)}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.timeTextColor }]}>
              Timeline View
            </Text>
          </View>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
            <Text style={[styles.saveText, { color: theme.saveButtonColor }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryContainer, { backgroundColor: theme.headerBackgroundColor }]}>
          <Text style={[styles.summaryTitle, { color: theme.headerTextColor }]}>
            {editingEvents.length} event{editingEvents.length !== 1 ? 's' : ''} in this hour
          </Text>
          {editingEvents.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsList}>
              {editingEvents.map((event, chipIndex) => (
                <TouchableOpacity
                  key={`chip_${event.id}_${chipIndex}`}
                  style={[styles.eventChip, { backgroundColor: event.color || theme.timeColumnBackgroundColor }]}
                  onPress={() => handleEventPress(event)}
                >
                  <Text style={[styles.eventChipText, { color: theme.headerTextColor }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventChipTime, { color: event.textColor || theme.timeTextColor }]}>
                    {event.startTime} - {event.endTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.instructionsContainer, { backgroundColor: theme.headerBackgroundColor }]}>
          <Text style={[styles.instructionsText, { color: theme.timeTextColor }]}>
            Tap on timeline to add event • Tap existing events to edit
          </Text>
        </View>

        <View style={[styles.timelineContainer, { backgroundColor: theme.backgroundColor }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.timelineScroll}>
            <View style={styles.timelineContent}>
              <View style={[styles.timelineTable, { 
                backgroundColor: theme.timelineBackgroundColor,
                borderColor: theme.gridLineColor 
              }]}>
                
                <TouchableOpacity style={[styles.majorRow, { borderBottomColor: theme.gridLineColor }]} onPress={handleTimelinePress} activeOpacity={1}>
                  <View style={[styles.timeColumn, { 
                    backgroundColor: theme.timeColumnBackgroundColor,
                    borderRightColor: theme.gridLineColor 
                  }]}>
                    <Text style={[styles.majorTimeText, { color: theme.timeTextColor }]}>
                      {formatTime(hour, 0, timeFormat)}
                    </Text>
                  </View>
                  <View style={[styles.timelineColumn, { backgroundColor: theme.eventAreaBackgroundColor }]}>
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(0, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(5, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(10, e)} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.majorRow, { borderBottomColor: theme.gridLineColor }]} onPress={handleTimelinePress} activeOpacity={1}>
                  <View style={[styles.timeColumn, { 
                    backgroundColor: theme.timeColumnBackgroundColor,
                    borderRightColor: theme.gridLineColor 
                  }]}>
                    <Text style={[styles.majorTimeText, { color: theme.timeTextColor }]}>
                      {formatTime(hour, 15, timeFormat)}
                    </Text>
                  </View>
                  <View style={[styles.timelineColumn, { backgroundColor: theme.eventAreaBackgroundColor }]}>
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(15, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(20, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(25, e)} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.majorRow, { borderBottomColor: theme.gridLineColor }]} onPress={handleTimelinePress} activeOpacity={1}>
                  <View style={[styles.timeColumn, { 
                    backgroundColor: theme.timeColumnBackgroundColor,
                    borderRightColor: theme.gridLineColor 
                  }]}>
                    <Text style={[styles.majorTimeText, { color: theme.timeTextColor }]}>
                      {formatTime(hour, 30, timeFormat)}
                    </Text>
                  </View>
                  <View style={[styles.timelineColumn, { backgroundColor: theme.eventAreaBackgroundColor }]}>
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(30, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(35, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(40, e)} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.majorRow, { borderBottomColor: theme.gridLineColor }]} onPress={handleTimelinePress} activeOpacity={1}>
                  <View style={[styles.timeColumn, { 
                    backgroundColor: theme.timeColumnBackgroundColor,
                    borderRightColor: theme.gridLineColor 
                  }]}>
                    <Text style={[styles.majorTimeText, { color: theme.timeTextColor }]}>
                      {formatTime(hour, 45, timeFormat)}
                    </Text>
                  </View>
                  <View style={[styles.timelineColumn, { backgroundColor: theme.eventAreaBackgroundColor }]}>
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(45, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(50, e)} />
                    <TouchableOpacity style={[styles.subRow, { borderBottomColor: theme.gridLineColor }]} onPress={(e) => handleSubRowPress(55, e)} />
                  </View>
                </TouchableOpacity>
                
              </View>

              {eventLayouts.map((layout, layoutIndex) => (
                <FloatingEventBlock
                  key={`${layout.event.id}_${layoutIndex}`}
                  event={layout.event}
                  style={{
                    top: layout.top,
                    height: layout.height,
                    left: layout.left,
                    width: layout.width,
                  }}
                  onPress={() => handleEventPress(layout.event)}
                  onEditPress={() => handleEventEditDirect(layout.event)}
                  isOverlapping={layout.totalColumns > 1}
                  overlapInfo={{
                    column: layout.column,
                    totalColumns: layout.totalColumns,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.addEventContainer, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity 
            style={[styles.addEventButton, { backgroundColor: theme.fabBackgroundColor }]}
            onPress={() => {
              setSelectedTimeRange({
                startTime: formatTime(hour, 0, timeFormat),
                endTime: formatTime(hour, 30, timeFormat)
              });
              setEditingEvent(undefined);
              setShowEventForm(true);
            }}
          >
            <Text style={[styles.addEventText, { color: theme.fabIconColor }]}>+ Add Event</Text>
          </TouchableOpacity>
        </View>

        <EventFormModal
          visible={showEventForm}
          hour={hour}
          timeFormat={timeFormat}
          initialStartTime={selectedTimeRange.startTime}
          initialEndTime={selectedTimeRange.endTime}
          existingEvent={editingEvent}
          onSave={handleEventSave}
          onCancel={() => setShowEventForm(false)}
          onClear={handleEventClear}
          theme={theme}
        />

        <EventViewModal
          visible={showEventView}
          event={viewingEvent}
          onClose={() => setShowEventView(false)}
          onEdit={handleEventEdit}
          timeFormat={timeFormat}
          theme={theme}
        />
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
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  eventsList: {
    marginTop: 5,
  },
  eventChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    minWidth: 100,
    maxWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventChipText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  eventChipTime: {
    fontSize: 9,
    fontWeight: '500',
    opacity: 0.8,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  instructionsText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  timelineTable: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  majorRow: {
    flexDirection: 'row',
    height: 120,
    borderBottomWidth: 1,
  },
  timeColumn: {
    width: TIME_LABEL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
  },
  timelineColumn: {
    flex: 1,
  },
  subRow: {
    height: 40,
    borderBottomWidth: 1,
  },
  majorTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addEventContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  addEventButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addEventText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
