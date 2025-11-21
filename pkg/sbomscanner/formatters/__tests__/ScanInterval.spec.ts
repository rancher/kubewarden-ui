import { shallowMount } from '@vue/test-utils';
import ScanInterval from '../ScanInterval.vue';

describe('ScanIntervalCell.vue', () => {
  const tMock = (key: any) => key; // simple mock translation

  function factory(propsData: any) {
    return shallowMount(ScanInterval, {
      propsData,
      mocks: { t: tMock }
    });
  }

  test('renders n/a when value is empty string', () => {
    const wrapper = factory({ value: '' });

    expect(wrapper.find('.scan-interval-none').exists()).toBe(true);
    expect(wrapper.find('.scan-interval-none').text()).toBe('n/a');
  });

  test('parses full h/m/s (e.g., "1h30m20s")', () => {
    const wrapper = factory({ value: '1h30m20s' });

    expect(wrapper.vm.scanInterval).toBe('1h30m20s');
    expect(wrapper.find('.scan-interval-text').text()).toContain('1h30m20s');
  });

  test('parses only hours (e.g., "2h")', () => {
    const wrapper = factory({ value: '2h' });

    expect(wrapper.vm.scanInterval).toBe('2h');
  });

  test('parses only minutes (e.g., "45m")', () => {
    const wrapper = factory({ value: '45m' });

    expect(wrapper.vm.scanInterval).toBe('45m');
  });

  test('parses only seconds (e.g., "10s")', () => {
    const wrapper = factory({ value: '10s' });

    expect(wrapper.vm.scanInterval).toBe('10s');
  });

  test('filters out zero values (e.g., "0h10m0s")', () => {
    const wrapper = factory({ value: '0h10m0s' });

    // Should remove hours and seconds
    expect(wrapper.vm.scanInterval).toBe('10m');
  });

  test('returns raw string when regex does not match', () => {
    const wrapper = factory({ value: 'invalid' });

    // regex still matches empty groups, but value="invalid" → returns original string
    expect(wrapper.vm.scanInterval).toBe('invalid');
  });

  test('renders translated prefix + parsed value', () => {
    const wrapper = factory({ value: '1h' });

    const text = wrapper.find('.scan-interval-text').text();

    expect(text).toContain('imageScanner.general.every');
    expect(text).toContain('1h');
  });
});
