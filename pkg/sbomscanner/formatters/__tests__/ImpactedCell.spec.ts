import { shallowMount } from '@vue/test-utils';
import ImpactedCell from '../ImpactedCell.vue';
import BlockPercentageBarAlt from '../../components/common/BlockPercentageBarAlt.vue';

describe('ImpactedCell.vue', () => {
  it('should render the value and calculate the correct percentage', () => {
    const mockValue = 50;
    const mockRow = { spec: { totalImages: 200 } };
    const mockCol = {};

    const wrapper = shallowMount(ImpactedCell, {
      props: {
        value: mockValue,
        row:   mockRow,
        col:   mockCol,
      },
    });

    const span = wrapper.find('.impacted span');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe('50');

    const progressBar = wrapper.findComponent(BlockPercentageBarAlt);

    expect(progressBar.exists()).toBe(true);
    expect(progressBar.props('ticks')).toBe(10);
    expect(progressBar.props('percentage')).toBe(25);
  });

  it('should use custom ticks from the col prop', () => {
    const mockValue = 10;
    const mockRow = { spec: { totalImages: 100 } };
    const mockCol = { formatterParams: { ticks: 5 } };

    const wrapper = shallowMount(ImpactedCell, {
      props: {
        value: mockValue,
        row:   mockRow,
        col:   mockCol,
      },
    });

    const progressBar = wrapper.findComponent(BlockPercentageBarAlt);

    expect(progressBar.props('ticks')).toBe(5);
    expect(progressBar.props('percentage')).toBe(10);
  });

  it('should handle zero totalImages to prevent division by zero', () => {
    const mockValue = 10;
    const mockRow = { spec: { totalImages: 0 } };
    const mockCol = {};

    const wrapper = shallowMount(ImpactedCell, {
      props: {
        value: mockValue,
        row:   mockRow,
        col:   mockCol,
      },
    });

    const progressBar = wrapper.findComponent(BlockPercentageBarAlt);

    expect(progressBar.props('percentage')).toBe(0);
  });

  it('should handle zero value', () => {
    const mockValue = 0;
    const mockRow = { spec: { totalImages: 100 } };
    const mockCol = {};

    const wrapper = shallowMount(ImpactedCell, {
      props: {
        value: mockValue,
        row:   mockRow,
        col:   mockCol,
      },
    });

    const progressBar = wrapper.findComponent(BlockPercentageBarAlt);

    expect(progressBar.props('percentage')).toBe(0);
  });
});
