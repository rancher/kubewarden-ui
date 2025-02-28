import { extractPortNumber } from '@kubewarden/utils/string';

describe('extractPortNumber', () => {
  it('should return the port number when a valid port is at the end of the string', () => {
    const input = 'my-open-telemetry-collector.jaeger.svc.cluster.local:4317';
    const result = extractPortNumber(input);

    expect(result).toBe(4317);
  });

  it('should return null when no port is present in the string', () => {
    const input = 'my-open-telemetry-collector.jaeger.svc.cluster.local';
    const result = extractPortNumber(input);

    expect(result).toBeNull();
  });

  it('should return null when a colon is present but not followed by digits', () => {
    const input = 'service:port';
    const result = extractPortNumber(input);

    expect(result).toBeNull();
  });

  it('should return null for an empty string', () => {
    const input = '';
    const result = extractPortNumber(input);

    expect(result).toBeNull();
  });

  it('should return the correct port when multiple colons exist but only the last segment is numeric', () => {
    const input = 'prefix:middle:1234';
    const result = extractPortNumber(input);

    expect(result).toBe(1234);
  });

  it('should correctly extract a port number of 0', () => {
    const input = 'my-service:0';
    const result = extractPortNumber(input);

    expect(result).toBe(0);
  });
});
