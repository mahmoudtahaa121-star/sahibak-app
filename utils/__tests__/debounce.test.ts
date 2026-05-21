import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../debounce';

describe('Debounce Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should delay function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    // Function should be called after delay
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should cancel previous execution if called again within delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(100);

    debouncedFn('second');
    vi.advanceTimersByTime(200);

    // First call should have been cancelled
    expect(mockFn).not.toHaveBeenCalled();

    // Complete the delay for second call
    vi.advanceTimersByTime(100);

    // Only second call should execute
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('second');
  });

  it('should handle multiple rapid calls correctly', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('call1');
    vi.advanceTimersByTime(50);

    debouncedFn('call2');
    vi.advanceTimersByTime(50);

    debouncedFn('call3');
    vi.advanceTimersByTime(50);

    debouncedFn('call4');

    // Complete the delay
    vi.advanceTimersByTime(300);

    // Only the last call should execute
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call4');
  });

  it('should preserve function context and arguments', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('arg1', 'arg2', 'arg3');
    vi.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });

  it('should work with different delay times', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 500);

    debouncedFn('test');
    vi.advanceTimersByTime(400);

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle zero delay', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn('test');
    vi.advanceTimersByTime(0);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle very short delays', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 10);

    debouncedFn('test');
    vi.advanceTimersByTime(5);
    debouncedFn('test2');
    vi.advanceTimersByTime(10);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('test2');
  });

  it('should execute function on trailing edge', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn('test');

    // Wait longer than delay
    vi.advanceTimersByTime(400);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple independent debounced functions', () => {
    const mockFn1 = vi.fn();
    const mockFn2 = vi.fn();
    const debouncedFn1 = debounce(mockFn1, 200);
    const debouncedFn2 = debounce(mockFn2, 400);

    debouncedFn1('fn1');
    debouncedFn2('fn2');

    vi.advanceTimersByTime(200);

    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns value', () => {
    const mockFn = vi.fn().mockReturnValue('result');
    const debouncedFn = debounce(mockFn, 300);

    const result = debouncedFn('test');
    vi.advanceTimersByTime(300);

    // Debounced function doesn't return the result immediately
    expect(result).toBeUndefined();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
