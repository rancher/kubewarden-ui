
import {
  jest, afterAll, beforeAll, beforeEach, afterEach, describe, it, expect
} from '@jest/globals';
import { mount } from '@vue/test-utils';
import BlockPercentageBar from '../BlockPercentageBar.vue';

describe('BlockPercentageBar.vue', () => {
  let wrapper;
  let mockEventHandler;
  let originalOffsetWidth;

  const setMockOffsetWidth = (width) => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value:        width,
    });
  };

  beforeAll(() => {
    originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
  });

  beforeEach(() => {
    setMockOffsetWidth(206);
    mockEventHandler = jest.fn();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth);
    } else {
      delete HTMLElement.prototype.offsetWidth;
    }
  });

  it('calculates total and filled blocks correctly on mount', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   50,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalBlocks).toBe(25);
    expect(wrapper.vm.filledBlocks).toBe(13);

    expect(wrapper.findAll('.block')).toHaveLength(25);
    expect(wrapper.findAll('.block.filled')).toHaveLength(13);
  });

  it('updates filled blocks when percentage prop changes', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   20,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filledBlocks).toBe(5);
    expect(wrapper.findAll('.block.filled')).toHaveLength(5);

    await wrapper.setProps({ percentage: 80 });

    expect(wrapper.vm.filledBlocks).toBe(20);
    expect(wrapper.findAll('.block.filled')).toHaveLength(20);
    expect(wrapper.findAll('.block')).toHaveLength(25);
  });

  it('calls the eventHandler prop on mount with calculateBlocks method', () => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   50,
        eventHandler: mockEventHandler,
      },
    });

    expect(mockEventHandler).toHaveBeenCalledTimes(1);
    expect(mockEventHandler).toHaveBeenCalledWith(wrapper.vm.calculateBlocks);
  });

  it('handles 0% percentage', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   0,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalBlocks).toBe(25);
    expect(wrapper.vm.filledBlocks).toBe(0);
    expect(wrapper.findAll('.block.filled')).toHaveLength(0);
  });

  it('handles 100% percentage', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   100,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalBlocks).toBe(25);
    expect(wrapper.vm.filledBlocks).toBe(25);
    expect(wrapper.findAll('.block.filled')).toHaveLength(25);
  });

  it('re-calculates blocks when eventHandler callback is invoked', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   50,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalBlocks).toBe(25);
    expect(wrapper.vm.filledBlocks).toBe(13);

    setMockOffsetWidth(400);

    const recalculateCallback = mockEventHandler.mock.calls[0][0];

    recalculateCallback();

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalBlocks).toBe(50);
    expect(wrapper.vm.filledBlocks).toBe(25);
    expect(wrapper.findAll('.block')).toHaveLength(50);
  });

  it('does nothing if element is not ready in calculateBlocks', async() => {
    wrapper = mount(BlockPercentageBar, {
      props: {
        percentage:   50,
        eventHandler: mockEventHandler,
      },
    });

    await wrapper.vm.$nextTick();

    const initialTotal = wrapper.vm.totalBlocks; // 25
    const initialFilled = wrapper.vm.filledBlocks; // 13

    jest.spyOn(wrapper.vm, '$refs', 'get').mockReturnValue({ bar: null });

    expect(() => wrapper.vm.calculateBlocks()).not.toThrow();

    expect(wrapper.vm.totalBlocks).toBe(initialTotal);
    expect(wrapper.vm.filledBlocks).toBe(initialFilled);
  });
});
