import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import ScanErrorCell from '../ScanErrorCell.vue';

jest.mock('@pkg/types', () => ({ REGISTRY_STATUS: { FAILED: 'failed' } }));

describe('ScanErrorCell.vue', () => {
  const mockT = jest.fn((key) => key);
  const mockRow = { metadata: { name: 'test-row' } };

  const mountComponent = (valueProp) => {
    return shallowMount(ScanErrorCell, {
      props: {
        value: valueProp,
        row:   mockRow,
      },
      global: { mocks: { t: mockT } },
    });
  };

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should render the error message when a failed condition is true', () => {
    const mockValue = {
      conditions: [
        {
          status: 'False', type: 'Complete', message: 'All good'
        },
        {
          status: 'True', type: 'Failed', message: 'Authentication error'
        },
      ],
    };

    const wrapper = mountComponent(mockValue);

    const errorDot = wrapper.find('.dot.failed');

    expect(errorDot.exists()).toBe(true);

    const status = wrapper.find('.status');

    expect(status.exists()).toBe(true);
    expect(status.text()).toBe('Authentication error');
    expect(status.classes()).not.toContain('text-muted');
    expect(mockT).not.toHaveBeenCalled();
  });

  it('should handle case-insensitive "Failed" type', () => {
    const mockValue = {
      conditions: [
        {
          status: 'True', type: 'FAILED', message: 'Auth error uppercase'
        },
      ],
    };

    const wrapper = mountComponent(mockValue);
    const status = wrapper.find('.status');

    expect(status.text()).toBe('Auth error uppercase');
  });

  it('should render "none" when the true condition is not "Failed"', () => {
    const mockValue = {
      conditions: [
        {
          status: 'True', type: 'Complete', message: 'All good'
        },
        {
          status: 'False', type: 'Failed', message: 'Old error'
        },
      ],
    };

    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot.failed').exists()).toBe(false);

    const status = wrapper.find('.status.text-muted');

    expect(status.exists()).toBe(true);
    expect(status.text()).toBe('imageScanner.general.none');
    expect(mockT).toHaveBeenCalledWith('imageScanner.general.none');
  });

  it('should render "none" when no condition status is "True"', () => {
    const mockValue = {
      conditions: [
        {
          status: 'False', type: 'Complete', message: 'All good'
        },
        {
          status: 'False', type: 'Failed', message: 'Auth error'
        },
      ],
    };

    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot.failed').exists()).toBe(false);
    const status = wrapper.find('.status.text-muted');

    expect(status.exists()).toBe(true);
    expect(status.text()).toBe('imageScanner.general.none');
  });

  it.each([
    { conditions: [] },
    { conditions: null },
    {},
  ])('should render "none" when conditions are empty or missing', (mockValue) => {
    const wrapper = mountComponent(mockValue);

    expect(wrapper.find('.dot.failed').exists()).toBe(false);
    const status = wrapper.find('.status.text-muted');

    expect(status.exists()).toBe(true);
    expect(status.text()).toBe('imageScanner.general.none');
  });
});
