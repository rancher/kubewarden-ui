import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import ScanInterval from '../ScanInterval.vue';

describe('ScanInterval.vue', () => {
  const mockT = jest.fn((key) => key);

  const mountComponent = (value) => {
    return shallowMount(ScanInterval, {
      props:  { value },
      global: { mocks: { t: mockT } },
    });
  };

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should render the interval when value is provided', () => {
    const mockValue = '1h 30m';
    const wrapper = mountComponent(mockValue);

    const span = wrapper.find('.scan-interval-text');

    expect(span.exists()).toBe(true);
    expect(span.classes()).not.toContain('text-muted');

    expect(mockT).toHaveBeenCalledTimes(1);
    expect(mockT).toHaveBeenCalledWith('imageScanner.general.every');

    expect(span.text()).toBe(`imageScanner.general.every\u00A0${ mockValue }`);
  });

  it('should render "n/a" when value is an empty string', () => {
    const mockValue = '';
    const wrapper = mountComponent(mockValue);

    const span = wrapper.find('.scan-interval-text');

    expect(span.exists()).toBe(true);
    expect(span.classes()).toContain('text-muted');
    expect(span.text()).toBe('n/a');

    expect(mockT).not.toHaveBeenCalled();
  });
});
