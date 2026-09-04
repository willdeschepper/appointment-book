//utils/timeHelpers.ts
import { ScheduleItem, TimeSlot } from '../types';

export const formatTime = (hour: number, minute: number = 0, format: '12' | '24' = '12'): string => {
  if (format === '24') {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  const clockHour = hour === 24 && minute === 0 ? 0 : ((hour % 24) + 24) % 24;
  const period = clockHour >= 12 ? 'PM' : 'AM';
  const displayHour = clockHour === 0 ? 12 : clockHour > 12 ? clockHour - 12 : clockHour;
  const displayMinute = minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`;
  
  return `${displayHour}${displayMinute} ${period}`;
};

export const formatTimeFromMinutes = (
  totalMinutes: number,
  format: '12' | '24' = '12',
): string => {
  if (!Number.isFinite(totalMinutes)) {
    return formatTime(0, 0, format);
  }

  const roundedMinutes = Math.trunc(totalMinutes);

  // Preserve the useful end-of-day representation instead of rendering
  // 00:00 when an event ends exactly at midnight.
  if (roundedMinutes === 24 * 60) {
    return format === '24' ? '24:00' : '12:00 AM';
  }

  const minutesInDay = ((roundedMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(minutesInDay / 60);
  const minute = minutesInDay % 60;

  return formatTime(hour, minute, format);
};

export const parseTime = (timeString: string): { hour: number; minute: number } => {
  const cleanTime = timeString.trim().toUpperCase();
  
  const isAMPM = cleanTime.includes('AM') || cleanTime.includes('PM');
  const isPM = cleanTime.includes('PM');
  
  const timePart = cleanTime.replace(/\s*(AM|PM)\s*/, '');
  
  let hour: number;
  let minute: number = 0;
  
  if (timePart.includes(':')) {
    const [hourStr, minuteStr] = timePart.split(':');
    hour = parseInt(hourStr, 10);
    minute = parseInt(minuteStr, 10) || 0;
  } else {
    hour = parseInt(timePart, 10);
  }
  
  if (isAMPM) {
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }
  }
  
  return { hour, minute };
};

export const timeToMinutes = (timeString: string): number => {
  const { hour, minute } = parseTime(timeString);
  return hour * 60 + minute;
};

export interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

export const getTimeRange = (startTime: string, endTime: string): TimeRange => {
  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  // In a single-day agenda, 12:00 AM after a late-evening start represents
  // the end of the day rather than the beginning of the same day.
  if (endMinutes === 0 && startMinutes > 0) {
    endMinutes = 24 * 60;
  }

  return { startMinutes, endMinutes };
};

export const createEventId = (): string => {
  const cryptoObject = globalThis.crypto;

  if (typeof cryptoObject?.randomUUID === 'function') {
    return `event_${cryptoObject.randomUUID()}`;
  }

  return `event_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
};

export const isTimeInRange = (
  currentHour: number,
  currentMinute: number,
  item: ScheduleItem
): boolean => {
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const { startMinutes, endMinutes } = getTimeRange(item.startTime, item.endTime);
  
  return currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes;
};

export const generateTimeSlots = (
  startHour: number,
  endHour: number,
  showMinutes: boolean,
  timeFormat: '12' | '24',
  scheduleItems: ScheduleItem[]
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const increment = showMinutes ? 30 : 60;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    const minutes = showMinutes ? [0, 30] : [0];
    
    for (const minute of minutes) {
      if (hour === endHour && minute > 0) break;
      
      const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const displayTime = formatTime(hour, minute, timeFormat);
      
      const item = scheduleItems.find(scheduleItem => 
        isTimeInRange(hour, minute, scheduleItem)
      );
      
      slots.push({
        time: timeKey,
        displayTime,
        item,
        isEmpty: !item,
      });
    }
  }
  
  return slots;
};

export const getDateInfo = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    dayName: dayNames[date.getDay()],
    formattedDate: `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
  };
};

export const getTodayISO = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (dateString: string, days: number): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  date.setDate(date.getDate() + days);
  
  const resultYear = date.getFullYear();
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0');
  const resultDay = String(date.getDate()).padStart(2, '0');
  
  return `${resultYear}-${resultMonth}-${resultDay}`;
};
