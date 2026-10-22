import { test } from 'node:test';
import assert from 'node:assert';
import { parseDevpostPeriod } from './devpostService';

const utcDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day));

test('parses a range across two months with a trailing year', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Aug 31 - Oct 23, 2026'), {
    start: utcDate(2026, 7, 31),
    end: utcDate(2026, 9, 23)
  });
});

test('parses a day-only end date', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Oct 05 - 27, 2026'), {
    start: utcDate(2026, 9, 5),
    end: utcDate(2026, 9, 27)
  });
});

test('parses a same-month range', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Sep 30 - Oct 30, 2026'), {
    start: utcDate(2026, 8, 30),
    end: utcDate(2026, 9, 30)
  });
});

test('parses a cross-year range', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Dec 20, 2026 - Jan 05, 2027'), {
    start: utcDate(2026, 11, 20),
    end: utcDate(2027, 0, 5)
  });
});

test('rolls the end year forward when the end year is omitted', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Dec 20, 2026 - Jan 05'), {
    start: utcDate(2026, 11, 20),
    end: utcDate(2027, 0, 5)
  });
});

test('inherits the end year for a month-first start date', () => {
  // With no explicit year anywhere, parsing falls back to the current year.
  const currentYear = new Date().getUTCFullYear();
  assert.deepStrictEqual(parseDevpostPeriod('Aug 31 - Oct 23'), {
    start: utcDate(currentYear, 7, 31),
    end: utcDate(currentYear, 9, 23)
  });
});

test('parses a single date into start and end', () => {
  assert.deepStrictEqual(parseDevpostPeriod('Nov 02, 2026'), {
    start: utcDate(2026, 10, 2),
    end: utcDate(2026, 10, 2)
  });
});

test('accepts en/em dashes and extra whitespace', () => {
  assert.deepStrictEqual(parseDevpostPeriod('  Oct 05 – 27, 2026 '), {
    start: utcDate(2026, 9, 5),
    end: utcDate(2026, 9, 27)
  });
});

test('returns null for empty or unparseable periods', () => {
  assert.strictEqual(parseDevpostPeriod(''), null);
  assert.strictEqual(parseDevpostPeriod('   '), null);
  assert.strictEqual(parseDevpostPeriod('TBD'), null);
  assert.strictEqual(parseDevpostPeriod('Coming soon!'), null);
});

test('returns null for impossible dates', () => {
  // Feb 30 would silently roll over to Mar 2 without the calendar guard.
  assert.strictEqual(parseDevpostPeriod('Feb 30, 2026'), null);
  assert.strictEqual(parseDevpostPeriod('Jan 01, 9999'), null);
});

test('returns null when the end date precedes the start date', () => {
  assert.strictEqual(parseDevpostPeriod('Oct 27 - 05'), null);
  assert.strictEqual(parseDevpostPeriod('2026 - 2025'), null);
});
