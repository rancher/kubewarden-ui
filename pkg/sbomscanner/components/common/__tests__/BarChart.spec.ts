import { shallowMount } from '@vue/test-utils';
import { jest } from '@jest/globals';
import BarChart from '../BarChart.vue';

const PercentageBar = {
  name:     'PercentageBar',
  props:    ['colorStops', 'value', 'height'],
  template: '<div class="mocked-percentage-bar"></div>',
};

const $t = (key) => key;

const factory = (propsData) => {
  return shallowMount(BarChart, {
    propsData,
    global: {
      components: { PercentageBar },
      mocks:      { t: $t },
    },
  });
};

describe('BarChart.vue', () => {
  const mockChartData = {
    critical: 10,
    high:     20,
    medium:   70,
  };

  const mockFilterFn = jest.fn();

  beforeEach(() => {
    mockFilterFn.mockClear();
  });

  describe('Rendering', () => {
    it('should compute the total correctly', () => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'cve',
      });

      expect(wrapper.vm.total).toBe(100);
    });

    it('should render the total and description', () => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Total Vulnerabilities',
        colorPrefix: 'cve',
      });

      const totalEl = wrapper.find('.vul-total');
      const descEl = wrapper.find('.vul-desc');

      expect(totalEl.text()).toBe('100');
      expect(descEl.text()).toBe('Total Vulnerabilities');
    });

    it('should render one chart item for each entry in chartData', () => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'cve',
      });

      const items = wrapper.findAll('.severity-item');

      expect(items).toHaveLength(3);
    });

    it('should render the correct text for names and values', () => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'cve',
      });

      const names = wrapper.findAll('.severity-item-name');
      const values = wrapper.findAll('.severity-item-value');

      // Check names (using the $t mock)
      expect(names[0].text()).toBe('imageScanner.enum.cve.critical');
      expect(names[1].text()).toBe('imageScanner.enum.cve.high');
      expect(names[2].text()).toBe('imageScanner.enum.cve.medium');

      // Check values
      expect(values[0].text()).toBe('10');
      expect(values[1].text()).toBe('20');
      expect(values[2].text()).toBe('70');
    });
  });

  describe('PercentageBar Props', () => {
    it('should pass correct percentages and colorStops to PercentageBar', () => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'status',
      });

      const bars = wrapper.findAllComponents(PercentageBar);

      expect(bars).toHaveLength(3);

      expect(bars[0].props('value')).toBe(10);
      expect(bars[0].props('colorStops')).toEqual({ 0: '--status-critical' });
      expect(bars[0].props('height')).toBe(7);

      expect(bars[1].props('value')).toBe(20);
      expect(bars[1].props('colorStops')).toEqual({ 0: '--status-high' });

      expect(bars[2].props('value')).toBe(70);
      expect(bars[2].props('colorStops')).toEqual({ 0: '--status-medium' });
    });
  });

  describe('Events', () => {
    it('should call filterFn with the correct category on click', async() => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'cve',
        filterFn:    mockFilterFn,
      });

      const names = wrapper.findAll('.severity-item-name');

      await names[0].trigger('click');
      expect(mockFilterFn).toHaveBeenCalledTimes(1);
      expect(mockFilterFn).toHaveBeenCalledWith('critical');

      await names[1].trigger('click');
      expect(mockFilterFn).toHaveBeenCalledTimes(2);
      expect(mockFilterFn).toHaveBeenCalledWith('high');
    });

    it('should not throw an error if filterFn is not provided', async() => {
      const wrapper = factory({
        chartData:   mockChartData,
        description: 'Test Desc',
        colorPrefix: 'cve',
        filterFn:    null, // Explicitly pass null (default)
      });

      const name = wrapper.find('.severity-item-name');

      // We just want to ensure this doesn't crash
      const clickAction = async() => await name.trigger('click');

      await expect(clickAction()).resolves.not.toThrow();
      expect(mockFilterFn).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero total correctly', () => {
      const zeroData = {
        critical: 0,
        high:     0,
        medium:   0,
      };
      const wrapper = factory({
        chartData:   zeroData,
        description: 'No Issues',
        colorPrefix: 'cve',
      });

      expect(wrapper.vm.total).toBe(0);
      expect(wrapper.find('.vul-total').text()).toBe('0');

      const bars = wrapper.findAllComponents(PercentageBar);

      expect(bars[0].props('value')).toBe(0); // 0 / 0 should return 0
      expect(bars[1].props('value')).toBe(0);
      expect(bars[2].props('value')).toBe(0);
    });

    it('should render nothing in the chart if chartData is empty', () => {
      const wrapper = factory({
        chartData:   {},
        description: 'Empty',
        colorPrefix: 'cve',
      });

      expect(wrapper.vm.total).toBe(0);
      expect(wrapper.find('.vul-total').text()).toBe('0');

      expect(wrapper.find('.severity-item').exists()).toBe(false);
      expect(wrapper.findComponent(PercentageBar).exists()).toBe(false);
    });
  });
});
