import { describe, expect, it } from 'vitest';
import {
  addDays,
  createEventId,
  formatTime,
  formatTimeFromMinutes,
  getTimeRange,
  parseTime,
  timeToMinutes,
} from '../src/utils/timeHelpers';

describe('time helpers', () => {
  it('formats 12-hour and 24-hour times', () => {
    expect(formatTime(0, 0, '12')).toBe('12 AM');
    expect(formatTime(12, 0, '12')).toBe('12 PM');
    expect(formatTime(14, 30, '12')).toBe('2:30 PM');
    expect(formatTime(14, 30, '24')).toBe('14:30');
    expect(formatTime(24, 0, '12')).toBe('12 AM');
  });

  it('formats minute offsets without producing an invalid :60 time', () => {
    expect(formatTimeFromMinutes(9 * 60 + 15, '12')).toBe('9:15 AM');
    expect(formatTimeFromMinutes(24 * 60, '12')).toBe('12:00 AM');
    expect(formatTimeFromMinutes(24 * 60, '24')).toBe('24:00');
  });

  it('parses meridiem and 24-hour values consistently', () => {
    expect(parseTime('12:05 AM')).toEqual({ hour: 0, minute: 5 });
    expect(parseTime('12:05 PM')).toEqual({ hour: 12, minute: 5 });
    expect(parseTime('14:30')).toEqual({ hour: 14, minute: 30 });
    expect(timeToMinutes('9:15 AM')).toBe(9 * 60 + 15);
    expect(getTimeRange('11:30 PM', '12:00 AM')).toEqual({
      startMinutes: 23 * 60 + 30,
      endMinutes: 24 * 60,
    });
  });

  it('adds calendar days across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  });

  it('generates usable identifiers without relying on a detached crypto method', () => {
    const first = createEventId();
    const second = createEventId();

    expect(first).toMatch(/^event_/);
    expect(second).toMatch(/^event_/);
    expect(first).not.toBe(second);
  });
});
