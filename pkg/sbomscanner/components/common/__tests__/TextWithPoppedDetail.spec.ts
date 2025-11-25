import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import TextWithPoppedDetail from '../TextWithPoppedDetail.vue';

describe('TextWithPoppedDetail.vue', () => {
  let wrapper;
  const mockDetail = {
    title:   'Test Title',
    message: 'Test Message',
    type:    'info'
  };

  const mountComponent = (props = {}) => {
    return shallowMount(TextWithPoppedDetail, {
      propsData: {
        value:  'Test Value',
        detail: mockDetail,
        ...props
      }
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.restoreAllMocks();
  });

  it('renders the value and detail props correctly', () => {
    wrapper = mountComponent();

    expect(wrapper.find('span').text()).toBe('Test Value');
    expect(wrapper.find('.title').text()).toBe('Test Title');
    expect(wrapper.find('.message').text()).toBe('Test Message');
  });

  describe('getStatusDotClass', () => {
    it('should return "dot failed" when detail.type is "error"', () => {
      wrapper = mountComponent({ detail: { ...mockDetail, type: 'error' } });
      expect(wrapper.vm.getStatusDotClass).toBe('dot failed');
      expect(wrapper.find('.dot.failed').exists()).toBe(true);
    });

    it('should return an empty string when detail.type is not "error"', () => {
      wrapper = mountComponent({ detail: { ...mockDetail, type: 'info' } });
      expect(wrapper.vm.getStatusDotClass).toBe('');
      expect(wrapper.find('.dot').exists()).toBe(false);
    });

    it('should return an empty string when detail.type is not provided', () => {
      wrapper = mountComponent({ detail: { title: 'No Type', message: 'No Type Msg' } });
      expect(wrapper.vm.getStatusDotClass).toBe('');
      expect(wrapper.find('.dot').exists()).toBe(false);
    });
  });

  describe('checkPosition', () => {
    let mockGetBoundingClientRect;
    let originalInnerHeight;

    beforeEach(() => {
      originalInnerHeight = window.innerHeight;
      Object.defineProperty(window, 'innerHeight', {
        writable:     true,
        configurable: true,
        value:        1000
      });

      wrapper = mountComponent();
      mockGetBoundingClientRect = jest.spyOn(wrapper.vm.$refs.trigger, 'getBoundingClientRect');
    });

    afterEach(() => {
      Object.defineProperty(window, 'innerHeight', {
        writable:     true,
        configurable: true,
        value:        originalInnerHeight
      });
    });

    it('should set showOnTop to true if there is not enough space at the bottom', async() => {
      mockGetBoundingClientRect.mockReturnValue({ bottom: 800 }); // 1000 - 800 = 200 < 300

      expect(wrapper.vm.showOnTop).toBe(false);
      expect(wrapper.find('.message-hover-overlay').classes()).not.toContain('show-top');

      await wrapper.find('.text-with-pop').trigger('mouseenter');

      expect(wrapper.vm.showOnTop).toBe(true);
      expect(wrapper.find('.message-hover-overlay').classes()).toContain('show-top');
    });

    it('should set showOnTop to false if there is enough space at the bottom', async() => {
      mockGetBoundingClientRect.mockReturnValue({ bottom: 500 }); // 1000 - 500 = 500 >= 300

      await wrapper.setData({ showOnTop: true });
      expect(wrapper.find('.message-hover-overlay').classes()).toContain('show-top');

      await wrapper.find('.text-with-pop').trigger('mouseenter');

      expect(wrapper.vm.showOnTop).toBe(false);
      expect(wrapper.find('.message-hover-overlay').classes()).not.toContain('show-top');
    });
  });
});
