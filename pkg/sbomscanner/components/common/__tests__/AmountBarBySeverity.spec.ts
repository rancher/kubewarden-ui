import { shallowMount } from '@vue/test-utils';
import AmountBarBySeverity from '../AmountBarBySeverity.vue';

const StackedPercentageBar = {
  name:     'StackedPercentageBar',
  props:    ['percentages', 'primaryClasses', 'height'],
  template: '<div class="mocked-stacked-bar"></div>',
};

const factory = (propsData) => {
  return shallowMount(AmountBarBySeverity, {
    propsData,
    global: { stubs: { StackedPercentageBar } }, // Stub the child component
  });
};

describe('AmountBarBySeverity.vue', () => {
  const mockCveAmount = {
    critical: 1,
    high:     2,
    medium:   3,
    low:      4,
    unknown:  5,
  };

  describe('Expanded View (default)', () => {
    it('should render the expanded bar by default', () => {
      const wrapper = factory({ cveAmount: mockCveAmount });

      expect(wrapper.find('.bar').exists()).toBe(true);
      expect(wrapper.findComponent(StackedPercentageBar).exists()).toBe(false);
    });

    it('should display the correct counts in the badges', () => {
      const wrapper = factory({ cveAmount: mockCveAmount });
      const badges = wrapper.findAll('.badge');

      expect(badges).toHaveLength(5);
      expect(badges[0].text()).toBe('1'); // critical
      expect(badges[1].text()).toBe('2'); // high
      expect(badges[2].text()).toBe('3'); // medium
      expect(badges[3].text()).toBe('4'); // low
      expect(badges[4].text()).toBe('5'); // unknown
    });

    it('should apply correct severity classes for non-zero counts', () => {
      const wrapper = factory({ cveAmount: mockCveAmount });
      const badges = wrapper.findAll('.badge');

      expect(badges[0].classes()).toContain('critical');
      expect(badges[1].classes()).toContain('high');
      expect(badges[2].classes()).toContain('medium');
      expect(badges[3].classes()).toContain('low');
      expect(badges[4].classes()).toContain('unknown');
      expect(wrapper.find('.zero').exists()).toBe(false);
    });

    it('should apply "zero" class for zero counts', () => {
      const zeroCounts = {
        critical: 1,
        high:     0,
        medium:   5,
        low:      0,
        unknown:  2,
      };
      const wrapper = factory({ cveAmount: zeroCounts });
      const badges = wrapper.findAll('.badge');

      expect(badges[0].classes()).toContain('critical');
      expect(badges[0].classes()).not.toContain('zero');
      expect(badges[2].classes()).toContain('medium');
      expect(badges[4].classes()).toContain('unknown');

      expect(badges[1].classes()).toContain('zero');
      expect(badges[1].classes()).not.toContain('high');
      expect(badges[3].classes()).toContain('zero');
      expect(badges[3].classes()).not.toContain('low');
    });

    it('should handle default empty cveAmount prop', () => {
      const wrapper = shallowMount(AmountBarBySeverity, { global: { stubs: { StackedPercentageBar } } });

      const badges = wrapper.findAll('.badge');

      expect(badges[0].text()).toBe('');
      expect(badges[0].classes()).toContain('zero');
      expect(badges[1].text()).toBe('');
      expect(badges[1].classes()).toContain('zero');
      expect(badges).toHaveLength(5);
      expect(wrapper.findAll('.zero')).toHaveLength(5);
    });
  });

  describe('Collapsed View', () => {
    it('should render StackedPercentageBar when isCollapsed is true', () => {
      const wrapper = factory({
        cveAmount:   mockCveAmount,
        isCollapsed: true,
      });

      expect(wrapper.find('.bar').exists()).toBe(false);
      expect(wrapper.findComponent(StackedPercentageBar).exists()).toBe(true);
    });

    it('should pass correct percentages to StackedPercentageBar', () => {
      const wrapper = factory({
        cveAmount:   mockCveAmount,
        isCollapsed: true,
      });

      const bar = wrapper.findComponent(StackedPercentageBar);
      const percentages = bar.props('percentages');

      expect(percentages).toHaveLength(5);
      expect(percentages[0]).toBeCloseTo((1 / 15) * 100); // critical
      expect(percentages[1]).toBeCloseTo((2 / 15) * 100); // high
      expect(percentages[2]).toBeCloseTo((3 / 15) * 100); // medium
      expect(percentages[3]).toBeCloseTo((4 / 15) * 100); // low
      expect(percentages[4]).toBeCloseTo((5 / 15) * 100); // unknown
    });

    it('should pass fixed props to StackedPercentageBar', () => {
      const wrapper = factory({
        cveAmount:   mockCveAmount,
        isCollapsed: true,
      });

      const bar = wrapper.findComponent(StackedPercentageBar);

      expect(bar.props('height')).toBe(7);
      expect(bar.props('primaryClasses')).toEqual([
        'critical',
        'high',
        'medium',
        'low',
        'unknown'
      ]);
    });

    it('should handle all-zero counts when calculating percentages', () => {
      const zeroAmounts = {
        critical: 0, high: 0, medium: 0, low: 0, unknown: 0,
      };
      const wrapper = factory({
        cveAmount:   zeroAmounts,
        isCollapsed: true,
      });

      const bar = wrapper.findComponent(StackedPercentageBar);
      const percentages = bar.props('percentages');

      expect(percentages).toEqual([NaN, NaN, NaN, NaN, NaN]);
    });
  });

  describe('Methods', () => {
    it('badgeColor() should return severity class for count > 0', () => {
      const wrapper = factory(); // Mount with any data
      const vm = wrapper.vm;

      expect(vm.badgeColor('critical', 10)).toEqual({ critical: true });
      expect(vm.badgeColor('high', 1)).toEqual({ high: true });
    });

    it('badgeColor() should return "zero" class for count <= 0', () => {
      const wrapper = factory();
      const vm = wrapper.vm;

      expect(vm.badgeColor('medium', 0)).toEqual({ zero: true });
      expect(vm.badgeColor('low', -1)).toEqual({ zero: true });
      expect(vm.badgeColor('unknown', undefined)).toEqual({ zero: true });
    });
  });
});
