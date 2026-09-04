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
    addDays,
    createEventId,
    formatTime,
    formatTimeFromMinutes,
    getDateInfo,
    getTimeRange,
    getTodayISO,
    timeToMinutes,
} from './utils/timeHelpers';
