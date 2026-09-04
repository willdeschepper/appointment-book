import { ScheduleItem } from '../types';
import { getTimeRange } from './timeHelpers';

export interface EventLayout {
  event: ScheduleItem;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  totalColumns: number;
}

export interface EventLayoutOptions {
  /** Number of pixels used to render one hour of the timeline. */
  pixelsPerHour: number;
  /** First visible hour, inclusive. */
  startHour: number;
  /** Last visible hour, exclusive. */
  endHour: number;
  /** Width available to the timeline, normally from useWindowDimensions(). */
  containerWidth: number;
  /** Width reserved for the time labels. */
  timeLabelWidth: number;
  /** Horizontal position where event blocks start. */
  leftOffset?: number;
  /** Width reserved outside the event columns (both side padding and labels). */
  widthOffset?: number;
  /** Vertical position where the timeline content starts. */
  topOffset?: number;
  /** Minimum height that keeps a short event tappable. */
  minimumHeight?: number;
  /** Gap between adjacent event columns. */
  columnGap?: number;
}

interface EventPosition {
  event: ScheduleItem;
  index: number;
  startMinute: number;
  endMinute: number;
  top: number;
  height: number;
  overlaps: number[];
}

const overlaps = (first: EventPosition, second: EventPosition): boolean =>
  first.startMinute < second.endMinute && second.startMinute < first.endMinute;

/**
 * Calculates event positions and columns for a visible timeline range.
 *
 * Events are clipped to the visible range so the same function can be used by
 * the full-day agenda and by the one-hour detail view.
 */
export const calculateEventLayouts = (
  events: ScheduleItem[],
  options: EventLayoutOptions,
): EventLayout[] => {
  const {
    pixelsPerHour,
    startHour,
    endHour,
    containerWidth,
    timeLabelWidth,
    leftOffset = timeLabelWidth,
    widthOffset = timeLabelWidth,
    topOffset = 0,
    minimumHeight = 32,
    columnGap = 0,
  } = options;

  const visibleStartMinute = startHour * 60;
  const visibleEndMinute = endHour * 60;

  const eventPositions: EventPosition[] = events
    .map((event, index): EventPosition | null => {
      const { startMinutes: eventStartMinute, endMinutes: eventEndMinute } =
        getTimeRange(event.startTime, event.endTime);

      if (
        !Number.isFinite(eventStartMinute) ||
        !Number.isFinite(eventEndMinute) ||
        eventEndMinute <= eventStartMinute
      ) {
        return null;
      }

      const startMinute = Math.max(eventStartMinute, visibleStartMinute);
      const endMinute = Math.min(eventEndMinute, visibleEndMinute);

      if (endMinute <= startMinute) {
        return null;
      }

      return {
        event,
        index,
        startMinute,
        endMinute,
        top:
          topOffset +
          ((startMinute - visibleStartMinute) / 60) * pixelsPerHour,
        height: Math.max(
          ((endMinute - startMinute) / 60) * pixelsPerHour,
          minimumHeight,
        ),
        overlaps: [] as number[],
      };
    })
    .filter((position): position is EventPosition => position !== null)
    .sort(
      (first, second) =>
        first.startMinute - second.startMinute || first.index - second.index,
    );

  for (let firstIndex = 0; firstIndex < eventPositions.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < eventPositions.length;
      secondIndex += 1
    ) {
      const first = eventPositions[firstIndex];
      const second = eventPositions[secondIndex];

      if (overlaps(first, second)) {
        first.overlaps.push(secondIndex);
        second.overlaps.push(firstIndex);
      }
    }
  }

  const layouts: EventLayout[] = [];
  const processedEvents = new Set<number>();
  const availableWidth = Math.max(containerWidth - widthOffset, 0);

  eventPositions.forEach((_, index) => {
    if (processedEvents.has(index)) {
      return;
    }

    const overlapGroup = new Set<number>([index]);
    const pending = [index];

    while (pending.length > 0) {
      const currentIndex = pending.pop() as number;
      eventPositions[currentIndex].overlaps.forEach((overlapIndex) => {
        if (!overlapGroup.has(overlapIndex)) {
          overlapGroup.add(overlapIndex);
          pending.push(overlapIndex);
        }
      });
    }

    const group = Array.from(overlapGroup).sort(
      (first, second) =>
        eventPositions[first].startMinute - eventPositions[second].startMinute ||
        eventPositions[first].index - eventPositions[second].index,
    );
    const columns: number[][] = [];

    group.forEach((eventIndex) => {
      const eventPosition = eventPositions[eventIndex];
      let assignedColumn = -1;

      for (let column = 0; column < columns.length; column += 1) {
        const canFit = columns[column].every(
          (existingIndex) => !overlaps(eventPosition, eventPositions[existingIndex]),
        );

        if (canFit) {
          assignedColumn = column;
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

    const totalColumns = Math.max(columns.length, 1);
    const columnWidth = availableWidth / totalColumns;

    group.forEach((eventIndex) => {
      const eventPosition = eventPositions[eventIndex];
      const column = columns.findIndex((items) => items.includes(eventIndex));

      layouts.push({
        event: eventPosition.event,
        top: eventPosition.top,
        height: eventPosition.height,
        left: leftOffset + column * columnWidth,
        width: Math.max(columnWidth - columnGap, 0),
        column,
        totalColumns,
      });
    });
  });

  return layouts;
};
