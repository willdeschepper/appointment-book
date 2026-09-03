# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial `appointment-book` scaffold, forked from the MIT-licensed
  `awesome-agenda` component by Yuresh Tharushika.
- `AgendaScheduler` daily timeline component with event add / edit / delete,
  overlapping-event layout, date picker, 12h/24h formats, current-time
  indicator and a themeable palette.
- `getTodayISO`, `addDays`, `formatTime`, `getDateInfo` helpers.
- Fresh build pipeline (tsup → cjs + esm + d.ts) and TypeScript config.
