import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import StatusBadge from '../StatusBadge.vue';
import { REGISTRY_STATUS, VEX_STATUS } from '@sbomscanner/types';

jest.mock('@sbomscanner/types', () => ({
  REGISTRY_STATUS: {
    PENDING:     'Pending',
    SCHEDULED:   'Scheduled',
    IN_PROGRESS: 'In-Progress',
    COMPLETE:    'Complete',
    FAILED:      'Failed',
  },
  VEX_STATUS: {
    DISABLED: 'Disabled',
    ENABLED:  'Enabled',
  }
}));

describe('StatusBadge.vue', () => {
  const mockT = jest.fn((key) => key);

  const mountComponent = (status) => {
    return shallowMount(StatusBadge, {
      propsData: { status },
      global:    { mocks: { t: mockT } }
    });
  };

  afterEach(() => {
    mockT.mockClear();
  });

  it('should render nothing in the text div if status is not provided', () => {
    const wrapper = mountComponent('');

    expect(wrapper.find('.text').exists()).toBe(false);
  });

  it('should apply the "none" class if status is not provided', () => {
    const wrapper = mountComponent('');

    expect(wrapper.classes()).toContain('none');
  });

  it('should apply the "none" class for an unknown status', () => {
    const wrapper = mountComponent('UnknownStatus');

    expect(wrapper.classes()).toContain('none');
    expect(wrapper.find('.text').classes()).toContain('none');
    expect(mockT).toHaveBeenCalledWith('imageScanner.enum.status.unknownstatus');
    expect(wrapper.text()).toBe('imageScanner.enum.status.unknownstatus');
  });

  const testCases = [
    [REGISTRY_STATUS.PENDING, 'pending', 'pending'],
    [REGISTRY_STATUS.SCHEDULED, 'scheduled', 'scheduled'],
    [REGISTRY_STATUS.IN_PROGRESS, 'in-progress', 'in-progress'],
    [REGISTRY_STATUS.COMPLETE, 'complete', 'complete'],
    [REGISTRY_STATUS.FAILED, 'failed', 'failed'],
    [VEX_STATUS.DISABLED, 'disabled', 'disabled'],
    [VEX_STATUS.ENABLED, 'enabled', 'enabled'],
  ];

  it.each(testCases)('should handle status %s correctly', (status, expectedClass, expectedKey) => {
    const wrapper = mountComponent(status);

    expect(wrapper.classes()).toContain(expectedClass);

    const textDiv = wrapper.find('.text');

    expect(textDiv.exists()).toBe(true);
    expect(textDiv.classes()).toContain(expectedClass);

    const expectedTKey = `imageScanner.enum.status.${ expectedKey }`;

    expect(mockT).toHaveBeenCalledWith(expectedTKey);
    expect(wrapper.text()).toBe(expectedTKey);
  });
});
