import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { isoDateArb, isoMonthArb } from '@/test/arbitraries';
import {
  addDays,
  addMonthsClamped,
  addMonthsToMonth,
  compareDates,
  daysInMonth,
  diffInDays,
  eachDayInRange,
  isInRange,
  isLeapYear,
  isValidISODate,
  isValidISOMonth,
  lastDayOfMonth,
  makeDate,
  monthOf,
  monthRange,
  today,
  weekdayOf,
} from './dates';

const MS_PER_DAY = 86_400_000;
const utcEpochDay = (date: string): number => Date.parse(`${date}T00:00:00Z`) / MS_PER_DAY;

describe('isValidISODate', () => {
  it.each(['2024-02-29', '2026-12-31', '0001-01-01', '9999-12-31'])('accepts %s', (date) => {
    expect(isValidISODate(date)).toBe(true);
  });

  it.each([
    '2023-02-29',
    '2026-04-31',
    '2026-13-01',
    '2026-00-10',
    '2026-01-00',
    '0000-01-01',
    '2026-1-01',
    '26-01-01',
    '2026-01-01T00:00',
    '',
  ])('rejects %j', (date) => {
    expect(isValidISODate(date)).toBe(false);
  });
});

describe('isValidISOMonth', () => {
  it('accepts YYYY-MM and rejects anything else', () => {
    expect(isValidISOMonth('2026-11')).toBe(true);
    expect(isValidISOMonth('2026-13')).toBe(false);
    expect(isValidISOMonth('2026-11-01')).toBe(false);
  });
});

describe('isLeapYear / daysInMonth', () => {
  it('follows the Gregorian rules', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
  });

  it('knows month lengths, including February in leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('throws on an invalid month', () => {
    expect(() => daysInMonth(2026, 13)).toThrow(RangeError);
  });
});

describe('makeDate', () => {
  it('clamps days past the end of the month', () => {
    expect(makeDate(2026, 2, 31)).toBe('2026-02-28');
    expect(makeDate(2024, 2, 30)).toBe('2024-02-29');
    expect(makeDate(2026, 4, 31)).toBe('2026-04-30');
    expect(makeDate(2026, 1, 0)).toBe('2026-01-01');
  });

  it("resolves 'last' to the last day of the month", () => {
    expect(makeDate(2024, 2, 'last')).toBe('2024-02-29');
    expect(makeDate(2026, 2, 'last')).toBe('2026-02-28');
  });

  it('zero-pads small years', () => {
    expect(makeDate(33, 3, 5)).toBe('0033-03-05');
  });
});

describe('lastDayOfMonth', () => {
  it('returns the last date of the month', () => {
    expect(lastDayOfMonth('2026-02-10')).toBe('2026-02-28');
    expect(lastDayOfMonth('2024-02-01')).toBe('2024-02-29');
    expect(lastDayOfMonth('2026-12-31')).toBe('2026-12-31');
  });

  it('throws on an invalid date', () => {
    expect(() => lastDayOfMonth('2026-02-30')).toThrow('Invalid ISO date: "2026-02-30"');
  });
});

describe('addDays', () => {
  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    expect(addDays('2026-11-07', 0)).toBe('2026-11-07');
  });

  it('does not remap years below 100', () => {
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
  });

  it('matches a UTC oracle for any date and offset', () => {
    fc.assert(
      fc.property(isoDateArb(), fc.integer({ min: -5000, max: 5000 }), (date, amount) => {
        const expected = new Date((utcEpochDay(date) + amount) * MS_PER_DAY)
          .toISOString()
          .slice(0, 10);
        expect(addDays(date, amount)).toBe(expected);
      }),
    );
  });

  it('is inverted by subtracting the same amount', () => {
    fc.assert(
      fc.property(isoDateArb(), fc.integer({ min: -5000, max: 5000 }), (date, amount) => {
        expect(addDays(addDays(date, amount), -amount)).toBe(date);
      }),
    );
  });
});

describe('addMonthsClamped', () => {
  it('clamps to the end of shorter months', () => {
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonthsClamped('2026-03-31', 1)).toBe('2026-04-30');
    expect(addMonthsClamped('2024-02-29', 12)).toBe('2025-02-28');
  });

  it('moves backwards across year boundaries', () => {
    expect(addMonthsClamped('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonthsClamped('2026-03-31', -13)).toBe('2025-02-28');
  });

  it('keeps the day when it fits and never exceeds it otherwise', () => {
    fc.assert(
      fc.property(isoDateArb(), fc.integer({ min: -600, max: 600 }), (date, amount) => {
        const result = addMonthsClamped(date, amount);
        const day = Number(date.slice(8));
        const resultDay = Number(result.slice(8));
        expect(isValidISODate(result)).toBe(true);
        expect(resultDay).toBe(Math.min(day, Number(lastDayOfMonth(result).slice(8))));
      }),
    );
  });
});

describe('diffInDays', () => {
  it('counts whole calendar days', () => {
    expect(diffInDays('2026-03-01', '2026-02-01')).toBe(28);
    expect(diffInDays('2024-03-01', '2024-02-01')).toBe(29);
    expect(diffInDays('2026-01-01', '2026-01-02')).toBe(-1);
  });

  it('is consistent with addDays', () => {
    fc.assert(
      fc.property(isoDateArb(), isoDateArb(), (a, b) => {
        expect(addDays(b, diffInDays(a, b))).toBe(a);
      }),
    );
  });
});

describe('eachDayInRange', () => {
  it('lists every day, both ends inclusive', () => {
    expect(eachDayInRange('2024-02-27', '2024-03-01')).toEqual([
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ]);
    expect(eachDayInRange('2026-01-01', '2026-01-01')).toEqual(['2026-01-01']);
  });

  it('is empty when the range is inverted', () => {
    expect(eachDayInRange('2026-01-02', '2026-01-01')).toEqual([]);
  });

  it('has diff + 1 consecutive days', () => {
    fc.assert(
      fc.property(isoDateArb(), fc.integer({ min: 0, max: 400 }), (from, length) => {
        const to = addDays(from, length);
        const days = eachDayInRange(from, to);
        expect(days).toHaveLength(length + 1);
        expect(days[0]).toBe(from);
        expect(days.at(-1)).toBe(to);
      }),
    );
  });
});

describe('weekdayOf', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(weekdayOf('2026-11-07')).toBe(6);
    expect(weekdayOf('2026-11-08')).toBe(0);
    expect(weekdayOf('1970-01-01')).toBe(4);
    expect(weekdayOf('1969-12-28')).toBe(0);
  });

  it('matches Date#getUTCDay', () => {
    fc.assert(
      fc.property(isoDateArb(), (date) => {
        expect(weekdayOf(date)).toBe(new Date(`${date}T00:00:00Z`).getUTCDay());
      }),
    );
  });
});

describe('compareDates / isInRange', () => {
  it('sorts dates ascending', () => {
    expect(['2026-02-01', '2025-12-31', '2026-01-15', '2026-01-15'].sort(compareDates)).toEqual([
      '2025-12-31',
      '2026-01-15',
      '2026-01-15',
      '2026-02-01',
    ]);
  });

  it('treats both range ends as inclusive', () => {
    const range = { from: '2026-01-01', to: '2026-01-31' };
    expect(isInRange('2026-01-01', range)).toBe(true);
    expect(isInRange('2026-01-31', range)).toBe(true);
    expect(isInRange('2025-12-31', range)).toBe(false);
    expect(isInRange('2026-02-01', range)).toBe(false);
  });
});

describe('today', () => {
  const instant = Date.UTC(2026, 0, 1, 2, 30); // 2026-01-01T02:30Z

  it('returns the calendar date in the given timezone', () => {
    expect(today(instant, 'UTC')).toBe('2026-01-01');
    expect(today(instant, 'America/New_York')).toBe('2025-12-31');
    expect(today(instant, 'Asia/Tokyo')).toBe('2026-01-01');
    expect(today(Date.UTC(2026, 0, 1, 20), 'Pacific/Kiritimati')).toBe('2026-01-02');
  });

  it("defaults to the runtime's timezone", () => {
    expect(today(instant)).toBe(today(instant, Intl.DateTimeFormat().resolvedOptions().timeZone));
  });
});

describe('months', () => {
  it('derives, shifts and spans months', () => {
    expect(monthOf('2026-11-07')).toBe('2026-11');
    expect(addMonthsToMonth('2026-01', -1)).toBe('2025-12');
    expect(addMonthsToMonth('2026-12', 1)).toBe('2027-01');
    expect(monthRange('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
    expect(monthRange('2026-04')).toEqual({ from: '2026-04-01', to: '2026-04-30' });
  });

  it('round-trips through monthRange', () => {
    fc.assert(
      fc.property(isoMonthArb(), fc.integer({ min: -240, max: 240 }), (month, amount) => {
        const shifted = addMonthsToMonth(month, amount);
        expect(addMonthsToMonth(shifted, -amount)).toBe(month);
        expect(monthOf(monthRange(shifted).to)).toBe(shifted);
      }),
    );
  });
});

describe.each([
  // Midnight DST gap: 2018-11-04 00:00 did not exist.
  ['America/Sao_Paulo', '2018-11-01', '2018-11-07'],
  ['America/New_York', '2026-03-06', '2026-03-10'],
  ['Europe/London', '2026-10-23', '2026-10-27'],
  // 30-minute DST shift.
  ['Australia/Lord_Howe', '2026-04-03', '2026-04-07'],
  // The whole day 2011-12-30 was skipped when Samoa crossed the date line.
  ['Pacific/Apia', '2011-12-28', '2012-01-02'],
])('in %s (DST / skipped days)', (timeZone, from, to) => {
  it('never shifts or skips calendar dates', () => {
    vi.stubEnv('TZ', timeZone);
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(timeZone);

    const days = eachDayInRange(from, to);
    expect(days).toHaveLength(diffInDays(to, from) + 1);
    days.slice(1).forEach((day, index) => {
      expect(day).toBe(addDays(days[index] ?? '', 1));
      expect(diffInDays(day, from)).toBe(index + 1);
    });
    expect(new Set(days.map(weekdayOf)).size).toBe(Math.min(days.length, 7));
  });
});
