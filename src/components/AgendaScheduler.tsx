//AgendaScheduler.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgendaProps, AgendaTheme, DaySchedule, ScheduleItem } from '../types';
import { addDays, formatTime, getDateInfo, getTodayISO, parseTime } from '../utils/timeHelpers';
import { DatePickerModal } from './DatePickerModal';
import { EventFormModal } from './EventFormModal';
import { EventViewModal } from './EventViewModal';
import { FloatingEventBlock } from './FloatingEventBlock';
import { HourTimelineView } from './HourTimelineView';

const { width: screenWidth } = Dimensions.get('window');
const TIME_LABEL_WIDTH = 80;

const defaultTheme: AgendaTheme = {
  backgroundColor: '#ffffff',
  headerBackgroundColor: '#f8f9fa',
  headerTextColor: '#333333',
  arrowColor: '#007bff',
  timeTextColor: '#666666',
  gridLineColor: '#e9ecef',
  timelineBackgroundColor: '#ffffff',
  timeColumnBackgroundColor: '#f8f9fa',
  eventAreaBackgroundColor: '#ffffff',
  currentHourBackgroundColor: 'rgba(0, 123, 255, 0.05)',
  currentHourBorderColor: 'rgba(0, 123, 255, 0.2)',
  currentHourTextColor: '#007bff',
  currentTimeLineColor: '#ff4444',
  fabBackgroundColor: '#007bff',
  fabIconColor: '#ffffff',
  todayIndicatorBackgroundColor: '#007bff',
  todayIndicatorTextColor: '#ffffff',
  todayButtonBackgroundColor: '#f0f8ff',
  todayButtonBorderColor: '#007bff',
  saveButtonColor: '#28a745',
  cancelButtonColor: '#dc3545',
  eventColorOptions: [
    { name: 'Blue', value: '#e3f2fd', textColor: '#1976d2' },
    { name: 'Green', value: '#e8f5e8', textColor: '#2e7d32' },
    { name: 'Orange', value: '#fff3e0', textColor: '#ef6c00' },
    { name: 'Purple', value: '#f3e5f5', textColor: '#7b1fa2' },
    { name: 'Red', value: '#ffebee', textColor: '#c62828' },
    { name: 'Teal', value: '#e0f2f1', textColor: '#00695c' },
    { name: 'Yellow', value: '#fffde7', textColor: '#f57f17' },
    { name: 'Gray', value: '#f5f5f5', textColor: '#424242' },
  ],
};

export const AgendaScheduler: React.FC<AgendaProps> = ({
  schedule,
  timeFormat = '12',
  cellHeight = 80,
  theme = {},
  showGridLines = true,
  initialDate,
  onScheduleChange,
  onEventAdd,
  onEventEdit,
  onEventDelete,
  onDayChange,
}) => {
  const startHour = 0;
  const endHour = 23;
  const today = getTodayISO();
  const mergedTheme = { ...defaultTheme, ...theme };
  
  const [internalSchedule, setInternalSchedule] = useState<DaySchedule[]>(schedule);
  const [currentDate, setCurrentDate] = useState(initialDate || today);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isHourDetailVisible, setIsHourDetailVisible] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleItem | undefined>();
  const [selectedTimeRange, setSelectedTimeRange] = useState({ startTime: '', endTime: '' });
  const [showEventView, setShowEventView] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<ScheduleItem | undefined>();

  const scrollViewRef = useRef<ScrollView>(null);

  const getCurrentHour = (): number => {
    const now = new Date();
    return now.getHours();
  };

  const currentHour = getCurrentHour();
  const isCurrentHour = (hour: number): boolean => {
    return isToday && hour === currentHour;
  };

  const handleFABPress = () => {
    const defaultStartHour = isToday ? Math.max(currentHour, startHour) : startHour;
    const defaultEndHour = Math.min(defaultStartHour + 1, endHour);
    
    setSelectedTimeRange({
      startTime: formatTime(defaultStartHour, 0, timeFormat),
      endTime: formatTime(defaultEndHour, 0, timeFormat)
    });
    setEditingEvent(undefined);
    setShowEventForm(true);
  };

  const getOrCreateDayData = (date: string): DaySchedule => {
    try {
      if (!date || typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const fallbackDate = getTodayISO();
        return {
          date: fallbackDate,
          dayName: getDateInfo(fallbackDate)?.dayName || 'Today',
          items: []
        };
      }

      const existingDay = internalSchedule?.find(day => day?.date === date);
      if (existingDay) {
        return existingDay;
      }
      
      const dateInfo = getDateInfo(date);
      const newDay: DaySchedule = {
        date,
        dayName: dateInfo?.dayName || 'Unknown',
        items: []
      };
      
      setInternalSchedule(prev => {
        const newSchedule = [...(prev || []), newDay];
        return newSchedule.sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));
      });
      
      return newDay;
    } catch (error) {
      const fallbackDate = getTodayISO();
      return {
        date: fallbackDate,
        dayName: 'Today',
        items: []
      };
    }
  };

  const currentDayData = useMemo(() => {
    try {
      return getOrCreateDayData(currentDate);
    } catch (error) {
      return {
        date: getTodayISO(),
        dayName: 'Today',
        items: []
      };
    }
  }, [currentDate, internalSchedule]);

  const isToday = currentDate === today;

  useEffect(() => {
    if (isToday && scrollViewRef.current) {
      setTimeout(() => {
        const currentHourIndex = Math.max(0, currentHour - startHour);
        const scrollPosition = currentHourIndex * cellHeight;
        
        scrollViewRef.current?.scrollTo({
          y: scrollPosition,
          animated: true,
        });
      }, 300);
    }
  }, [currentDate, isToday, currentHour, startHour, cellHeight]);

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
    
    const startHourIndex = start.hour - startHour;
    const endHourIndex = end.hour - startHour;
    
    const top = startHourIndex * cellHeight + (start.minute / 60) * cellHeight;
    const bottom = endHourIndex * cellHeight + (end.minute / 60) * cellHeight;
    const height = Math.max(bottom - top, 32);
    
    return {
      event,
      startMinute: start.hour * 60 + start.minute,
      endMinute: end.hour * 60 + end.minute,
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
    const baseWidth = screenWidth - TIME_LABEL_WIDTH; 
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
      
      const leftOffset = TIME_LABEL_WIDTH + (column * columnWidth);
      
      eventLayouts.push({
        event: eventPos.event,
        top: eventPos.top,
        height: eventPos.height,
        left: leftOffset,
        width: columnWidth,
        column,
        totalColumns,
      });
    });
  });

  return eventLayouts;
};

  const updateScheduleWithCallbacks = (
    updatedSchedule: DaySchedule[], 
    action: 'add' | 'edit' | 'delete',
    event?: ScheduleItem,
    eventId?: string,
    date?: string
  ) => {
    setInternalSchedule(updatedSchedule);
    
    if (onScheduleChange) {
      onScheduleChange(updatedSchedule);
    }
    
    if (action === 'add' && event && date) {
      onEventAdd?.(event, date);
    } else if (action === 'edit' && event && date) {
      onEventEdit?.(event, date);
    } else if (action === 'delete' && eventId && date) {
      onEventDelete?.(eventId, date);
    }
  };

  const goToPreviousDay = () => {
    const previousDate = addDays(currentDate, -1);
    setCurrentDate(previousDate);
    onDayChange?.(previousDate);
  };

  const goToNextDay = () => {
    const nextDate = addDays(currentDate, 1);
    setCurrentDate(nextDate);
    onDayChange?.(nextDate);
  };

  const goToToday = () => {
    setCurrentDate(today);
    onDayChange?.(today);
  };

  const handleDatePick = (selectedDate: string) => {
    setCurrentDate(selectedDate);
    onDayChange?.(selectedDate);
    setShowDatePicker(false);
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleHourPress = (hour: number) => {
    setSelectedHour(hour);
    setIsHourDetailVisible(true);
  };

  const handleTimelinePress = (hour: number) => {
    let defaultStartHour = hour;
    let defaultStartMinute = 0;
    
    if (isToday && hour === currentHour) {
      const now = new Date();
      const currentMinute = now.getMinutes();
      defaultStartMinute = Math.ceil(currentMinute / 15) * 15;
      
      if (defaultStartMinute >= 60) {
        defaultStartHour = Math.min(hour + 1, endHour);
        defaultStartMinute = 0;
      }
    }
    
    const startTime = formatTime(defaultStartHour, defaultStartMinute, timeFormat);
    const endTime = formatTime(defaultStartHour, Math.min(defaultStartMinute + 30, 60), timeFormat);
    
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
    let updatedEvents = [...currentDayData.items];
    let action: 'add' | 'edit' = 'add';
    let finalEvent: ScheduleItem;

    if (editingEvent) {
      action = 'edit';
      const eventIndex = updatedEvents.findIndex(e => e.id === editingEvent.id);
      if (eventIndex !== -1) {
        finalEvent = {
          ...eventData,
          id: editingEvent.id,
          startTime,
          endTime,
        };
        updatedEvents[eventIndex] = finalEvent;
      }
    } else {
      action = 'add';
      finalEvent = {
        ...eventData,
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime,
        endTime,
      };
      updatedEvents.push(finalEvent);
    }

    const updatedSchedule = internalSchedule.map(daySchedule => {
      if (daySchedule.date === currentDate) {
        return {
          ...daySchedule,
          items: updatedEvents.sort((a, b) => {
            const aStart = parseTime(a.startTime);
            const bStart = parseTime(b.startTime);
            return (aStart.hour * 60 + aStart.minute) - (bStart.hour * 60 + bStart.minute);
          })
        };
      }
      return daySchedule;
    });

    updateScheduleWithCallbacks(updatedSchedule, action, finalEvent!, undefined, currentDate);
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleEventClear = () => {
    if (editingEvent) {
      const updatedEvents = currentDayData.items.filter(e => e.id !== editingEvent.id);
      
      const updatedSchedule = internalSchedule.map(daySchedule => {
        if (daySchedule.date === currentDate) {
          return {
            ...daySchedule,
            items: updatedEvents
          };
        }
        return daySchedule;
      });

      updateScheduleWithCallbacks(updatedSchedule, 'delete', undefined, editingEvent.id, currentDate);
    }
    setShowEventForm(false);
    setEditingEvent(undefined);
  };

  const handleHourSave = (hour: number, updatedEvents: ScheduleItem[]) => {
    const updatedSchedule = internalSchedule.map(daySchedule => {
      if (daySchedule.date === currentDate) {
        const eventsToKeep = daySchedule.items.filter(item => {
          const start = parseTime(item.startTime);
          const end = parseTime(item.endTime);
          const eventStartMinutes = start.hour * 60 + start.minute;
          const eventEndMinutes = end.hour * 60 + end.minute;
          const hourStartMinutes = hour * 60;
          const hourEndMinutes = (hour + 1) * 60;
          return !(eventStartMinutes < hourEndMinutes && eventEndMinutes > hourStartMinutes);
        });
        
        const newItems = [...eventsToKeep, ...updatedEvents];
        
        const sortedItems = newItems.sort((a, b) => {
          const aStart = parseTime(a.startTime);
          const bStart = parseTime(b.startTime);
          return (aStart.hour * 60 + aStart.minute) - (bStart.hour * 60 + bStart.minute);
        });

        return {
          ...daySchedule,
          items: sortedItems
        };
      }
      return daySchedule;
    });
    
    onScheduleChange?.(updatedSchedule);
    setInternalSchedule(updatedSchedule);
    setIsHourDetailVisible(false);
  };

  const hourSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push({
        hour,
        displayHour: formatTime(hour, 0, timeFormat),
        isCurrentHour: isCurrentHour(hour),
      });
    }
    return slots;
  }, [startHour, endHour, timeFormat, isToday, currentHour]);

  const eventLayouts = calculateEventLayout(currentDayData.items);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: mergedTheme.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: mergedTheme.headerBackgroundColor }]}>
        <View style={styles.leftControls}>
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={goToPreviousDay}
            activeOpacity={0.7}
          >
            <Text style={[styles.arrow, { color: mergedTheme.arrowColor }]}>‹</Text>
          </TouchableOpacity>
          
          {currentDate > today && (
            <TouchableOpacity 
              style={[
                styles.todayButton,
                { 
                  backgroundColor: mergedTheme.todayButtonBackgroundColor,
                  borderColor: mergedTheme.todayButtonBorderColor 
                }
              ]} 
              onPress={goToToday}
              activeOpacity={0.7}
            >
              <Text style={[styles.todayButtonText, { color: mergedTheme.arrowColor }]}>
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.dayInfo} onPress={handleDatePress}>
          <View style={styles.dayNameContainer}>
            <Text style={[styles.dayName, { color: mergedTheme.headerTextColor }]}>
              {currentDayData.dayName || 'Loading...'}
            </Text>
            {isToday && (
              <View style={[
                styles.todayIndicator,
                { backgroundColor: mergedTheme.todayIndicatorBackgroundColor }
              ]}>
                <Text style={[
                  styles.todayText,
                  { color: mergedTheme.todayIndicatorTextColor }
                ]}>
                  Today
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.date, { color: mergedTheme.headerTextColor }]}>
            {getDateInfo(currentDate).formattedDate || 'Invalid Date'}
          </Text>
          <Text style={[styles.tapHint, { color: mergedTheme.headerTextColor }]}>
            Tap to select date
          </Text>
        </TouchableOpacity>
        
        <View style={styles.rightControls}>
          <TouchableOpacity 
            style={styles.arrowButton} 
            onPress={goToNextDay}
            activeOpacity={0.7}
          >
            <Text style={[styles.arrow, { color: mergedTheme.arrowColor }]}>›</Text>
          </TouchableOpacity>
          
          {currentDate < today && (
            <TouchableOpacity 
              style={[
                styles.todayButton,
                { 
                  backgroundColor: mergedTheme.todayButtonBackgroundColor,
                  borderColor: mergedTheme.todayButtonBorderColor 
                }
              ]} 
              onPress={goToToday}
              activeOpacity={0.7}
            >
              <Text style={[styles.todayButtonText, { color: mergedTheme.arrowColor }]}>
                Today
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Timeline Container */}
      <ScrollView 
        ref={scrollViewRef} 
        style={[
          styles.timelineContainer,
          { backgroundColor: mergedTheme.backgroundColor }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineContent}>
          <View style={[
            styles.timelineTable,
            { backgroundColor: mergedTheme.timelineBackgroundColor }
          ]}>
            {hourSlots.map((hourSlot) => (
              <View
                key={`hour_${hourSlot.hour}`}
                style={[
                  styles.hourRow,
                  { height: cellHeight },
                  showGridLines && {
                    borderBottomWidth: 1,
                    borderBottomColor: mergedTheme.gridLineColor
                  },
                  hourSlot.isCurrentHour && {
                    backgroundColor: mergedTheme.currentHourBackgroundColor,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderTopColor: mergedTheme.currentHourBorderColor,
                    borderBottomColor: mergedTheme.currentHourBorderColor,
                  },
                ]}
              >
                <TouchableOpacity 
                  style={[
                    styles.timeColumn,
                    { backgroundColor: mergedTheme.timeColumnBackgroundColor },
                    hourSlot.isCurrentHour && {
                      backgroundColor: mergedTheme.currentHourBackgroundColor,
                      position: 'relative',
                    }
                  ]}
                  onPress={() => handleHourPress(hourSlot.hour)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.timeText, 
                    { color: mergedTheme.timeTextColor },
                    hourSlot.isCurrentHour && {
                      color: mergedTheme.currentHourTextColor,
                      fontWeight: '700',
                    }
                  ]}>
                    {hourSlot.displayHour || `${hourSlot.hour}:00`}
                  </Text>
                  {hourSlot.isCurrentHour && (
                    <View style={[
                      styles.currentHourDot,
                      { 
                        backgroundColor: mergedTheme.currentHourTextColor,
                        shadowColor: mergedTheme.currentHourTextColor,
                      }
                    ]} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.timelineColumn,
                    { backgroundColor: mergedTheme.eventAreaBackgroundColor },
                    hourSlot.isCurrentHour && {
                      backgroundColor: mergedTheme.currentHourBackgroundColor,
                    }
                  ]}
                  onPress={() => handleTimelinePress(hourSlot.hour)}
                  activeOpacity={0.1}
                />
              </View>
            ))}
          </View>

          {/* Floating event blocks */}
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

          {/* Current time line indicator */}
          {isToday && currentHour >= startHour && currentHour <= endHour && (
            (() => {
              const now = new Date();
              const currentMinute = now.getMinutes();
              const hourIndex = currentHour - startHour;
              const lineTop = hourIndex * cellHeight + (currentMinute / 60) * cellHeight;
              
              return (
                <View style={[styles.currentTimeLine, { top: lineTop }]}>
                  <View style={[
                    styles.currentTimeCircle,
                    { 
                      backgroundColor: mergedTheme.currentTimeLineColor,
                      shadowColor: mergedTheme.currentTimeLineColor,
                    }
                  ]} />
                  <View style={[
                    styles.currentTimeLineBar,
                    { 
                      backgroundColor: mergedTheme.currentTimeLineColor,
                      shadowColor: mergedTheme.currentTimeLineColor,
                    }
                  ]} />
                </View>
              );
            })()
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.floatingActionButton,
          { backgroundColor: mergedTheme.fabBackgroundColor }
        ]}
        onPress={handleFABPress}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.fabIcon,
          { color: mergedTheme.fabIconColor }
        ]}>+</Text>
      </TouchableOpacity>

      {/* Hour Detail Modal */}
      {isHourDetailVisible && selectedHour !== null && (
        <HourTimelineView
          hour={selectedHour}
          date={currentDate}
          events={currentDayData.items.filter(event => {
            const start = parseTime(event.startTime);
            const end = parseTime(event.endTime);
            const eventStartMinutes = start.hour * 60 + start.minute;
            const eventEndMinutes = end.hour * 60 + end.minute;
            const hourStartMinutes = selectedHour * 60;
            const hourEndMinutes = (selectedHour + 1) * 60;
            
            return eventStartMinutes < hourEndMinutes && eventEndMinutes > hourStartMinutes;
          })}
          onSave={handleHourSave}
          onClose={() => setIsHourDetailVisible(false)}
          timeFormat={timeFormat}
          theme={mergedTheme}
        />
      )}

      {/* Event Form Modal */}
      <EventFormModal
        visible={showEventForm}
        hour={selectedTimeRange.startTime ? parseTime(selectedTimeRange.startTime).hour : startHour}
        timeFormat={timeFormat}
        initialStartTime={selectedTimeRange.startTime}
        initialEndTime={selectedTimeRange.endTime}
        existingEvent={editingEvent}
        onSave={handleEventSave}
        onCancel={() => setShowEventForm(false)}
        onClear={handleEventClear}
        theme={mergedTheme}
      />

      {/* Event View Modal */}
      {showEventView && viewingEvent && (
        <EventViewModal
          visible={showEventView}
          event={viewingEvent}
          onClose={() => setShowEventView(false)}
          onEdit={handleEventEdit}
          timeFormat={timeFormat}
          theme={mergedTheme}
        />
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        currentDate={currentDate}
        today={today}
        onDateSelect={handleDatePick}
        onCancel={() => setShowDatePicker(false)}
        theme={mergedTheme}
      />
    </SafeAreaView>
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
  arrowButton: {
    padding: 10,
    minWidth: 44,
    alignItems: 'center',
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dayInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  todayIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  todayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    marginTop: 2,
  },
  tapHint: {
    fontSize: 11,
    marginTop: 1,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  todayButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContent: {
    position: 'relative',
  },
  timelineTable: {
    overflow: 'hidden',
  },
  hourRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  timeColumn: {
    width: TIME_LABEL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  timelineColumn: {
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 30,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 24,
    fontWeight: '600',
  },
  currentHourDot: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  currentTimeLine: {
    position: 'absolute',
    left: TIME_LABEL_WIDTH,
    right: 0, 
    height: 2,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  currentTimeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  currentTimeLineBar: {
    flex: 1,
    height: 2,
    opacity: 0.8,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },
});