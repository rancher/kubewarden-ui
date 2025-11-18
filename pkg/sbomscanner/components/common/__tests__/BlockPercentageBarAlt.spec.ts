import { shallowMount } from '@vue/test-utils';
import BlockPercentageBarAlt from '../BlockPercentageBarAlt.vue';

describe('BlockPercentageBarAlt.vue', () => {
  it('should render the correct number of filled ticks based on percentage', () => {
    const wrapper = shallowMount(BlockPercentageBarAlt, { props: { percentage: 50 } });

    const expectedFilled = 11;
    const expectedUnfilled = 23 - expectedFilled;

    expect(wrapper.vm.filledTicks).toBe(expectedFilled);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(expectedFilled);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(expectedUnfilled);
  });

  it('should respect the custom ticks prop', () => {
    const wrapper = shallowMount(BlockPercentageBarAlt, {
      props: {
        percentage: 25,
        ticks:      40,
      },
    });

    const expectedFilled = 10;
    const expectedUnfilled = 40 - expectedFilled;

    expect(wrapper.vm.filledTicks).toBe(expectedFilled);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(expectedFilled);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(expectedUnfilled);
    expect(wrapper.findAll('.percentage-bar-tick')).toHaveLength(40);
  });

  it('should render zero filled ticks for 0%', () => {
    const wrapper = shallowMount(BlockPercentageBarAlt, { props: { percentage: 0, ticks: 30 } });

    expect(wrapper.vm.filledTicks).toBe(0);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(0);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(30);
  });

  it('should render all ticks as filled for 100%', () => {
    const wrapper = shallowMount(BlockPercentageBarAlt, { props: { percentage: 100, ticks: 30 } });

    expect(wrapper.vm.filledTicks).toBe(30);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(30);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(0);
  });

  it('should render at least one filled tick if percentage is > 0', () => {
    const wrapper = shallowMount(BlockPercentageBarAlt, { props: { percentage: 1, ticks: 50 } });

    expect(wrapper.vm.filledTicks).toBe(1);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(1);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(49);
  });

  it('should update filled ticks when percentage prop changes', async() => {
    const wrapper = shallowMount(BlockPercentageBarAlt, { props: { percentage: 50, ticks: 20 } });

    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(10);

    await wrapper.setProps({ percentage: 10 });

    expect(wrapper.vm.filledTicks).toBe(2);
    expect(wrapper.findAll('.percentage-bar-tick.filled')).toHaveLength(2);
    expect(wrapper.findAll('.percentage-bar-tick:not(.filled)')).toHaveLength(18);
  });
});
