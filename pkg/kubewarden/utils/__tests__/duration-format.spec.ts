import { formatDuration } from '@kubewarden/utils/duration-format';

const ONE_MILLISECOND = 1000;                   // 1ms in microseconds
const ONE_SECOND = 1000 * ONE_MILLISECOND;        // 1,000,000
const ONE_MINUTE = 60 * ONE_SECOND;               // 60,000,000

describe('formatDuration', () => {
  it('should return a decimal representation for small durations (seconds)', () => {
    // 1.5 seconds: 1,500,000 microseconds
    expect(formatDuration(1500000)).toBe('1.5s');
  });

  it('should combine primary and secondary units when applicable (minutes and seconds)', () => {
    // 5 minutes and 30 seconds:
    // 5 minutes = 5 * ONE_MINUTE = 300,000,000 microseconds
    // 30 seconds = 30 * ONE_SECOND = 30,000,000 microseconds
    // Total = 330,000,000 microseconds
    expect(formatDuration(330000000)).toBe('5m 30s');
  });

  it('should return only the primary unit when the secondary unit rounds to 0', () => {
    // Exactly 5 minutes (300,000,000 microseconds) should return "5m"
    expect(formatDuration(300000000)).toBe('5m');
  });

  it('should handle very small durations (microseconds)', () => {
    // 123 microseconds should return "123μs"
    expect(formatDuration(123)).toBe('123μs');
  });

  it('should correctly format durations in hours and minutes', () => {
    // 1 hour and 30 minutes:
    // 1 hour = ONE_HOUR = 3,600,000,000 microseconds
    // 30 minutes = 30 * ONE_MINUTE = 1,800,000,000 microseconds
    // Total = 5,400,000,000 microseconds
    expect(formatDuration(5400000000)).toBe('1h 30m');
  });

  it('should return a decimal representation for milliseconds', () => {
    // 500 milliseconds = 500 * ONE_MILLISECOND = 500,000 microseconds
    expect(formatDuration(500000)).toBe('500ms');
  });

  it('should round decimals to two decimal places', () => {
    // 1,234,567 microseconds is approximately 1.234567s, rounded to 1.23s
    expect(formatDuration(1234567)).toBe('1.23s');
  });

  it('should correctly handle an exact unit boundary (exactly one minute)', () => {
    // Exactly one minute (60,000,000 microseconds) should return "1m"
    expect(formatDuration(ONE_MINUTE)).toBe('1m');
  });
});
