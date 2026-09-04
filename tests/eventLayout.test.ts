import { describe, expect, it } from 'vitest';
import { ScheduleItem } from '../src/types';
import { calculateEventLayouts } from '../src/utils/eventLayout';

const event = (
  id: string,
  startTime: string,
  endTime: string,
): ScheduleItem => ({
  id,
  startTime,
  endTime,
  title: id,
});

const fullDayOptions = (containerWidth: number) => ({
  pixelsPerHour: 80,
  startHour: 0,
  endHour: 24,
  containerWidth,
  timeLabelWidth: 80,
});

describe('calculateEventLayouts', () => {
  it('places overlapping events in separate columns', () => {
    const layouts = calculateEventLayouts(
      [event('first', '9:00 AM', '10:00 AM'), event('second', '9:30 AM', '10:30 AM')],
      fullDayOptions(400),
    );

    expect(layouts).toHaveLength(2);
    expect(layouts.map((layout) => layout.totalColumns)).toEqual([2, 2]);
    expect(layouts[0].column).not.toBe(layouts[1].column);
    expect(layouts[0].width).toBe(160);
  });

  it('reuses a column for adjacent events', () => {
    const layouts = calculateEventLayouts(
      [event('first', '9:00 AM', '10:00 AM'), event('second', '10:00 AM', '11:00 AM')],
      fullDayOptions(400),
    );

    expect(layouts.map((layout) => layout.totalColumns)).toEqual([1, 1]);
    expect(layouts.map((layout) => layout.column)).toEqual([0, 0]);
  });

  it('clips events to the visible hour and responds to width changes', () => {
    const options = {
      pixelsPerHour: 480,
      startHour: 9,
      endHour: 10,
      containerWidth: 360,
      timeLabelWidth: 80,
      leftOffset: 100,
      widthOffset: 120,
      topOffset: 20,
      columnGap: 2,
    };
    const item = event('spanning', '8:45 AM', '9:15 AM');
    const narrow = calculateEventLayouts([item], options)[0];
    const wide = calculateEventLayouts([item], { ...options, containerWidth: 600 })[0];

    expect(narrow.top).toBe(20);
    expect(narrow.height).toBe(120);
    expect(wide.width).toBeGreaterThan(narrow.width);
  });

  it('ignores malformed or non-visible events', () => {
    const layouts = calculateEventLayouts(
      [
        event('invalid', 'not-a-time', '10:00 AM'),
        event('outside', '11:00 AM', '12:00 PM'),
      ],
      { ...fullDayOptions(400), startHour: 9, endHour: 10 },
    );

    expect(layouts).toEqual([]);
  });
});
