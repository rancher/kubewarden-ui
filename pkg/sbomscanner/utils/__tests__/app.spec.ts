import { jest } from '@jest/globals';
import { decodeBase64 } from '../app';

const mockAtob = jest.fn();

global.atob = mockAtob;

describe('decodeBase64', () => {
  beforeEach(() => {
    mockAtob.mockClear();
  });

  it('should return the decoded string when atob succeeds', () => {
    const base64Str = 'SGVsbG8gV29ybGQ=';
    const decodedStr = 'Hello World';

    mockAtob.mockReturnValue(decodedStr);

    const result = decodeBase64(base64Str);

    expect(result).toBe(decodedStr);
    expect(mockAtob).toHaveBeenCalledWith(base64Str);
    expect(mockAtob).toHaveBeenCalledTimes(1);
  });

  it('should return the original string when atob throws an error', () => {
    const invalidStr = 'not-valid-base64';
    const error = new Error('Failed to decode');

    mockAtob.mockImplementation(() => {
      throw error;
    });

    const result = decodeBase64(invalidStr);

    expect(result).toBe(invalidStr);
    expect(mockAtob).toHaveBeenCalledWith(invalidStr);
    expect(mockAtob).toHaveBeenCalledTimes(1);
  });
});
