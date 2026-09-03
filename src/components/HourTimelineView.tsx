//HourTimelineView.tsx
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HourDetailProps, ScheduleItem } from '../types';
import { formatTime, parseTime } from '../utils/timeHelpers';
import { EventFormModal } from './EventFormModal';
import { EventViewModal } from './EventViewModal';
import { FloatingEventBlock } from './FloatingEventBlock';

const { width: screenWidth } = Dimensions.get('window');
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
    
    const startTime = formatTime(hour, startMinute, timeFormat);
    const endTime = endMinute >= 60 
      ? formatTime(hour + 1, 0, timeFormat)
      : formatTime(hour, endMinute, timeFormat);
    
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
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

  const calculateEventLayout = (events: ScheduleItem[]) => {
    const eventLayouts: Array<{
      event: ScheduleItem;
      top: number;
      height: number;
      left: number;
      width: number;
      column: number;
      totalColumns: number;
    }> = [];

    const sortedEvents = [...events].sort((a, b) => {
      const aStart = parseTime(a.startTime);
      const bStart = parseTime(b.startTime);
      return (aStart.hour * 60 + aStart.minute) - (bStart.hour * 60 + bStart.minute);
    });

    const eventPositions = sortedEvents.map(event => {
      const start = parseTime(event.startTime);
      const end = parseTime(event.endTime);
      
      const startMinute = start.hour === hour ? start.minute : 0;
      const endMinute = end.hour === hour ? end.minute : 60;
      
      const top = (startMinute / 5) * 40;
      const height = Math.max(((endMinute - startMinute) / 5) * 40, 32);
      
      return {
        event,
        startMinute,
        endMinute,
        top,
        height,
        overlaps: [] as number[],
      };
    });

    for (let i = 0; i < eventPositions.length; i++) {
      for (let j = i + 1; j < eventPositions.length; j++) {
        const event1 = eventPositions[i];
        const event2 = eventPositions[j];
        
        if (event1.startMinute < event2.endMinute && event2.startMinute < event1.endMinute) {
          event1.overlaps.push(j);
          event2.overlaps.push(i);
        }
      }
    }

    const processedEvents = new Set<number>();
    
    eventPositions.forEach((eventPos, index) => {
      if (processedEvents.has(index)) return;
      
      const overlapGroup = new Set([index]);
      const toProcess = [index];
      
      while (toProcess.length > 0) {
        const currentIndex = toProcess.pop()!;
        eventPositions[currentIndex].overlaps.forEach(overlapIndex => {
          if (!overlapGroup.has(overlapIndex)) {
            overlapGroup.add(overlapIndex);
            toProcess.push(overlapIndex);
          }
        });
      }
      
      const groupArray = Array.from(overlapGroup).sort((a, b) => 
        eventPositions[a].startMinute - eventPositions[b].startMinute
      );
      
      const columns: number[][] = [];
      
      groupArray.forEach(eventIndex => {
        const eventPos = eventPositions[eventIndex];
        let assignedColumn = -1;
        
        for (let col = 0; col < columns.length; col++) {
          let canFit = true;
          for (const existingEventIndex of columns[col]) {
            const existingEvent = eventPositions[existingEventIndex];
            if (eventPos.startMinute < existingEvent.endMinute && 
                existingEvent.startMinute < eventPos.endMinute) {
              canFit = false;
              break;
            }
          }
          if (canFit) {
            assignedColumn = col;
            break;
          }
        }
        
        if (assignedColumn === -1) {
          assignedColumn = columns.length;
          columns.push([]);
        }
        
        columns[assignedColumn].push(eventIndex);
        processedEvents.add(eventIndex);
      });
      
      const totalColumns = columns.length;
      const baseWidth = screenWidth - TIME_LABEL_WIDTH - 40;
      const columnWidth = baseWidth / totalColumns;
      
      groupArray.forEach(eventIndex => {
        const eventPos = eventPositions[eventIndex];
        
        let column = 0;
        for (let col = 0; col < columns.length; col++) {
          if (columns[col].includes(eventIndex)) {
            column = col;
            break;
          }
        }
        
        const leftOffset = TIME_LABEL_WIDTH + 20 + (column * columnWidth);
        
        eventLayouts.push({
          event: eventPos.event,
          top: eventPos.top + 20,
          height: eventPos.height,
          left: leftOffset,
          width: columnWidth - 2,
          column,
          totalColumns,
        });
      });
    });

    return eventLayouts;
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.header, { backgroundColor: theme.headerBackgroundColor }]}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.cancelButtonColor }]}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.headerTextColor }]}>
              {formatTime(hour, 0, timeFormat)} - {formatTime(hour + 1, 0, timeFormat)}
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

              {calculateEventLayout(editingEvents).map((layout, layoutIndex) => (
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