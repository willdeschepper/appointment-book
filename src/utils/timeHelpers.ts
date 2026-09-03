//utils/timeHelpers.ts
import { ScheduleItem, TimeSlot } from '../types';

export const formatTime = (hour: number, minute: number = 0, format: '12' | '24' = '12'): string => {
  if (format === '24') {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`;
  
  return `${displayHour}${displayMinute} ${period}`;
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

export const isTimeInRange = (
  currentHour: number,
  currentMinute: number,
  item: ScheduleItem
): boolean => {
  const startTime = parseTime(item.startTime);
  const endTime = parseTime(item.endTime);
  
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = startTime.hour * 60 + startTime.minute;
  const endTotalMinutes = endTime.hour * 60 + endTime.minute;
  
  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
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