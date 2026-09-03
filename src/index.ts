// src/index.ts
export { AgendaScheduler } from './components/AgendaScheduler';
export type {
    AgendaProps,
    AgendaTheme,
    DaySchedule,
    ScheduleItem,
    TimeSlot
} from './types';
export {
    addDays, formatTime, getDateInfo, getTodayISO
} from './utils/timeHelpers';

