# appointment-book

A customizable daily agenda / timeline scheduling component for React Native.

`appointment-book` renders a scrollable 24-hour timeline for a single day, with
add / edit / delete of events, overlapping-event layout, a date picker, 12h/24h
time formats, a current-time indicator, and a fully themeable palette.

## Installation

```sh
npm install appointment-book
# or
yarn add appointment-book
```

### Peer dependencies

```sh
npm install @react-native-community/datetimepicker react-native-safe-area-context
```

| Package                                  | Version |
| ---------------------------------------- | ------- |
| `react`                                  | >= 17   |
| `react-native`                           | >= 0.70 |
| `@react-native-community/datetimepicker` | ^8.4.2  |
| `react-native-safe-area-context`         | ^5.4.0  |

Wrap your app in `SafeAreaProvider` (from `react-native-safe-area-context`) if you
have not already.

## Usage

```tsx
import React, { useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import {
  AgendaScheduler,
  getTodayISO,
  type DaySchedule
} from 'appointment-book'

export default function App() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    {
      date: getTodayISO(),
      dayName: 'Today',
      items: [
        {
          id: '1',
          title: 'Standup',
          startTime: '9:00 AM',
          endTime: '9:30 AM',
          category: 'Work'
        }
      ]
    }
  ])

  return (
    <SafeAreaProvider>
      <AgendaScheduler
        schedule={schedule}
        timeFormat="12"
        onScheduleChange={setSchedule}
        onEventAdd={(event, date) => console.log('added', event, date)}
        onDayChange={date => console.log('viewing', date)}
      />
    </SafeAreaProvider>
  )
}
```

## API

### `<AgendaScheduler />`

| Prop               | Type                                          | Default | Description                                                          |
| ------------------ | --------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `schedule`         | `DaySchedule[]`                               | —       | Days and their events. Days not present are created empty on demand. |
| `timeFormat`       | `'12' \| '24'`                                | `'12'`  | Time label format.                                                   |
| `cellHeight`       | `number`                                      | `80`    | Pixel height of one hour row.                                        |
| `theme`            | `Partial<AgendaTheme>`                        | `{}`    | Overrides merged onto the default theme.                             |
| `showGridLines`    | `boolean`                                     | `true`  | Show hour grid lines.                                                |
| `initialDate`      | `string` (`YYYY-MM-DD`)                       | today   | Day shown on mount.                                                  |
| `onScheduleChange` | `(schedule: DaySchedule[]) => void`           | —       | Fired on any mutation of the schedule.                               |
| `onEventAdd`       | `(event: ScheduleItem, date: string) => void` | —       | Fired after an event is created.                                     |
| `onEventEdit`      | `(event: ScheduleItem, date: string) => void` | —       | Fired after an event is edited.                                      |
| `onEventDelete`    | `(eventId: string, date: string) => void`     | —       | Fired after an event is deleted.                                     |
| `onDayChange`      | `(date: string) => void`                      | —       | Fired when the visible day changes.                                  |

### Types

```ts
interface ScheduleItem {
  id: string
  startTime: string // e.g. "9:00 AM" or "14:30"
  endTime: string
  title: string
  description?: string
  color?: string // event background
  textColor?: string // event text
  category?: string
}

interface DaySchedule {
  date: string // YYYY-MM-DD
  dayName: string
  items: ScheduleItem[]
}
```

`AgendaTheme` exposes 20+ color keys (header, grid lines, current-hour highlight,
FAB, save/cancel buttons, event color presets, …). Pass any subset via `theme`.

### Helpers

```ts
import { getTodayISO, addDays, formatTime, getDateInfo } from 'appointment-book'

getTodayISO() // "2026-09-03"
addDays('2026-09-03', 7) // "2026-09-10"
formatTime(14, 30, '12') // "2:30 PM"
getDateInfo('2026-09-03') // { dayName, formattedDate, shortDate }
```

## Development

```sh
npm install
npm run typecheck
npm run build      # bundles to dist/ (cjs + esm + d.ts) via tsup
```

## License

MIT — © 2025 Wiliam De Schepper, © 2026 Wiliam De Schepper. See `LICENSE`.
# appointment-book
