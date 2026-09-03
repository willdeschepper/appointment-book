// src/types/index.ts

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  color?: string;
  textColor?: string;
  category?: string;
}

export interface DaySchedule {
  date: string;
  dayName: string;
  items: ScheduleItem[];
}

export interface AgendaTheme {
  backgroundColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  arrowColor: string;
  timeTextColor: string;
  gridLineColor: string;
  timelineBackgroundColor: string;
  timeColumnBackgroundColor: string;
  eventAreaBackgroundColor: string;
  currentHourBackgroundColor: string;
  currentHourBorderColor: string;
  currentHourTextColor: string;
  currentTimeLineColor: string;
  fabBackgroundColor: string;
  fabIconColor: string;
  todayIndicatorBackgroundColor: string;
  todayIndicatorTextColor: string;
  todayButtonBackgroundColor: string;
  todayButtonBorderColor: string;
  saveButtonColor: string;
  cancelButtonColor: string;
  eventColorOptions: Array<{
    name: string;
    value: string;
    textColor: string;
  }>;
}

export interface AgendaProps {
  schedule: DaySchedule[];
  timeFormat?: '12' | '24';
  cellHeight?: number;
  theme?: Partial<AgendaTheme>;
  showGridLines?: boolean;
  initialDate?: string;
  onScheduleChange?: (schedule: DaySchedule[]) => void;
  onEventAdd?: (event: ScheduleItem, date: string) => void;
  onEventEdit?: (event: ScheduleItem, date: string) => void;
  onEventDelete?: (eventId: string, date: string) => void;
  onDayChange?: (date: string) => void;
}

export interface HourDetailProps {
  hour: number;
  date: string;
  events: ScheduleItem[];
  onSave: (hour: number, events: ScheduleItem[]) => void;
  onClose: () => void;
  timeFormat: '12' | '24';
  theme: AgendaTheme;
}

export interface EventFormProps {
  visible: boolean;
  hour: number;
  timeFormat: '12' | '24';
  initialStartTime?: string;
  initialEndTime?: string;
  existingEvent?: ScheduleItem;
  onSave: (eventData: Omit<ScheduleItem, 'id'>, startTime: string, endTime: string) => void;
  onCancel: () => void;
  onClear?: () => void;
  theme: AgendaTheme;
}

export interface FloatingEventBlockProps {
  event: ScheduleItem;
  style: {
    top: number;
    height: number;
    left: number;
    width: number;
  };
  onPress: () => void;
  onEditPress?: () => void;
  isOverlapping?: boolean;
  overlapInfo?: {
    column: number;
    totalColumns: number;
  };
}

export interface EventViewModalProps {
  visible: boolean;
  event?: ScheduleItem;
  onClose: () => void;
  onEdit: (event: ScheduleItem) => void;
  timeFormat: '12' | '24';
  theme: AgendaTheme;
}

export interface DatePickerModalProps {
  visible: boolean;
  currentDate: string;
  today: string;
  onDateSelect: (date: string) => void;
  onCancel: () => void;
  theme: AgendaTheme;
}

export interface TimeSlot {
  time: string;
  displayTime: string;
  item?: ScheduleItem;
  isEmpty: boolean;
}