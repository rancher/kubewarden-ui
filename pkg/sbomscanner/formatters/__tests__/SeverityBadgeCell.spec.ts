import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import SeverityBadgeCell from '../SeverityBadgeCell.vue';

describe('SeverityBadgeCell.vue', () => {
  const mockT = jest.fn((key) => key);

  const mountComponent = (row) => {
    return shallowMount(SeverityBadgeCell, {
      props:  { row },
      global: { mocks: { t: mockT } },
    });
  };

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should render the translated string for a given severity', () => {
    const mockRow = { severity: 'High' };
    const wrapper = mountComponent(mockRow);

    expect(mockT).toHaveBeenCalledTimes(1);
    expect(mockT).toHaveBeenCalledWith('imageScanner.enum.cve.High');

    expect(wrapper.text()).toBe('imageScanner.enum.cve.High');
  });

  it('should handle different severity values', () => {
    const mockRow = { severity: 'Critical' };
    const wrapper = mountComponent(mockRow);

    expect(mockT).toHaveBeenCalledWith('imageScanner.enum.cve.Critical');
    expect(wrapper.text()).toBe('imageScanner.enum.cve.Critical');
  });
});
