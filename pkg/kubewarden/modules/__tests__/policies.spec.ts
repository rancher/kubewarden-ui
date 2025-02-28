import { kwDefaultsHelmChartSettings } from '@kubewarden/modules/policies';

describe('kwDefaultsHelmChartSettings', () => {
  it('should return true if uiPluginVersion is less than or equal to 1.4.1 regardless of kwDefaultsVersion', () => {
    expect(kwDefaultsHelmChartSettings('0.0.0', '1.4.1')).toBe(true);
    expect(kwDefaultsHelmChartSettings('1.9.9', '1.4.1')).toBe(true);
    expect(kwDefaultsHelmChartSettings('2.0.0', '1.0.0')).toBe(true);
  });

  it('should return true if uiPluginVersion is greater than 1.4.1 and kwDefaultsVersion is greater than 1.9.9', () => {
    // Example: uiPluginVersion "1.4.2" > "1.4.1" and "2.0.0" > "1.9.9"
    expect(kwDefaultsHelmChartSettings('2.0.0', '1.4.2')).toBe(true);
    expect(kwDefaultsHelmChartSettings('2.1.0', '2.0.0')).toBe(true);
  });

  it('should return false if uiPluginVersion is greater than 1.4.1 and kwDefaultsVersion is not greater than 1.9.9', () => {
    // "1.9.9" is not strictly greater than "1.9.9", and "1.8.0" is less than "1.9.9"
    expect(kwDefaultsHelmChartSettings('1.9.9', '1.4.2')).toBe(false);
    expect(kwDefaultsHelmChartSettings('1.8.0', '1.4.2')).toBe(false);
  });
});
