import { shallowMount } from '@vue/test-utils';
import RegistryStatusCellBadge from '../RegistryStatusCellBadge.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';

describe('RegistryStatusCellBadge.vue', () => {
  it('should render StatusBadge and pass the value as a lowercase status prop', () => {
    const mockValue = 'Active';

    const wrapper = shallowMount(RegistryStatusCellBadge, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('active');
  });

  it('should handle already lowercase values', () => {
    const mockValue = 'inactive';

    const wrapper = shallowMount(RegistryStatusCellBadge, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('inactive');
  });

  it('should handle mixed case values', () => {
    const mockValue = 'Pending';

    const wrapper = shallowMount(RegistryStatusCellBadge, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('pending');
  });
});
