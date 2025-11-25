import { shallowMount } from '@vue/test-utils';
import StackedPercentageBar from '../StackedPercentageBar.vue';

describe('StackedPercentageBar.vue', () => {
  it('renders with default props', () => {
    const percentages = [10, 20];
    const wrapper = shallowMount(StackedPercentageBar, { propsData: { percentages } });

    const indicators = wrapper.findAll('.indicator');

    expect(indicators.length).toBe(2);

    expect(wrapper.vm.barStyle.height).toBe('15px');
    expect(wrapper.vm.barStyle.backgroundColor).toBe('var(--border)');
    expect(wrapper.vm.barStyle.borderRadius).toBe('7.5px');

    expect(wrapper.vm.indicatorStyle[0].width).toBe('10%');
    expect(wrapper.vm.indicatorStyle[0].height).toBe('15px');

    expect(wrapper.vm.indicatorStyle[1].width).toBe('20%');
    expect(wrapper.vm.indicatorStyle[1].height).toBe('15px');
  });

  it('renders with custom props', () => {
    const percentages = [25, 30, 5];
    const primaryColors = ['--red', '--green', '--blue'];
    const secondaryColor = '--grey';
    const height = 10;

    const wrapper = shallowMount(StackedPercentageBar, {
      propsData: {
        percentages,
        primaryColors,
        secondaryColor,
        height
      }
    });

    const indicators = wrapper.findAll('.indicator');

    expect(indicators.length).toBe(3);

    // Test computed styles directly
    expect(wrapper.vm.barStyle.height).toBe('10px');
    expect(wrapper.vm.barStyle.backgroundColor).toBe('var(--grey)');
    expect(wrapper.vm.barStyle.borderRadius).toBe('5px');
  });

  it('renders no indicators if percentages array is empty', () => {
    const wrapper = shallowMount(StackedPercentageBar, { propsData: { percentages: [] } });

    const indicators = wrapper.findAll('.indicator');

    expect(indicators.length).toBe(0);
  });

  it('renders a single indicator correctly', () => {
    const wrapper = shallowMount(StackedPercentageBar, { propsData: { percentages: [80] } });

    const indicators = wrapper.findAll('.indicator');

    expect(indicators.length).toBe(1);

    expect(wrapper.vm.indicatorStyle[0].width).toBe('80%');
  });

  it('computes barStyle correctly', () => {
    const wrapper = shallowMount(StackedPercentageBar, {
      propsData: {
        percentages:    [10],
        secondaryColor: '--custom-bg',
        height:         50
      }
    });

    expect(wrapper.vm.barStyle).toEqual({
      backgroundColor: 'var(--custom-bg)',
      height:          '50px',
      borderRadius:    '25px',
    });
  });

  it('computes indicatorStyle correctly', () => {
    const wrapper = shallowMount(StackedPercentageBar, {
      propsData: {
        percentages:   [10, 20],
        primaryColors: ['--color1', '--color2'],
        height:        10
      }
    });

    expect(wrapper.vm.indicatorStyle).toEqual([
      {
        width:  '10%',
        height: '10px'
      },
      {
        width:  '20%',
        height: '10px'
      }
    ]);
  });
});
