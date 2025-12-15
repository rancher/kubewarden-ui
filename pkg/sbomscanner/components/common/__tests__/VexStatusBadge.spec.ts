import { jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';
import VexStatusBadge from '../VexStatusBadge.vue';
import { VEX_STATUS } from '@sbomscanner/types';

jest.mock('@sbomscanner/types', () => ({
  VEX_STATUS: {
    ENABLED:  'enabled',
    DISABLED: 'disabled',
  }
}));

describe('VexStatusBadge.vue', () => {
  let mockT;

  beforeEach(() => {
    mockT = jest.fn((key) => key);
  });

  const mountComponent = (enabled) => {
    return shallowMount(VexStatusBadge, {
      propsData: { enabled },
      global:    { mocks: { t: mockT } }
    });
  };

  it('should render correctly when enabled is true', () => {
    const wrapper = mountComponent(true);

    expect(wrapper.vm.statusClass).toBe(VEX_STATUS.ENABLED);
    expect(wrapper.classes()).toContain(VEX_STATUS.ENABLED);
    expect(wrapper.classes()).not.toContain(VEX_STATUS.DISABLED);

    const expectedKey = 'imageScanner.enum.status.enabled';

    expect(mockT).toHaveBeenCalledWith(expectedKey);
    expect(wrapper.find('.text').text()).toBe(expectedKey);
  });

  it('should render correctly when enabled is false', () => {
    const wrapper = mountComponent(false);

    expect(wrapper.vm.statusClass).toBe(VEX_STATUS.DISABLED);
    expect(wrapper.classes()).toContain(VEX_STATUS.DISABLED);
    expect(wrapper.classes()).not.toContain(VEX_STATUS.ENABLED);

    const expectedKey = 'imageScanner.enum.status.disabled';

    expect(mockT).toHaveBeenCalledWith(expectedKey);
    expect(wrapper.find('.text').text()).toBe(expectedKey);
  });

  it('should render as disabled by default if enabled prop is not provided', () => {
    const wrapper = shallowMount(VexStatusBadge, { global: { mocks: { t: mockT } } });

    expect(wrapper.vm.statusClass).toBe(VEX_STATUS.DISABLED);
    expect(wrapper.classes()).toContain(VEX_STATUS.DISABLED);

    const expectedKey = 'imageScanner.enum.status.disabled';

    expect(mockT).toHaveBeenCalledWith(expectedKey);
    expect(wrapper.find('.text').text()).toBe(expectedKey);
  });
});
