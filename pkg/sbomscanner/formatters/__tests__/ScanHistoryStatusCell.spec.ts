import { shallowMount } from '@vue/test-utils';
import ScanHistoryStatusCell from '../ScanHistoryStatusCell.vue';
import StatusBadge from '../../components/common/StatusBadge.vue';

describe('ScanHistoryStatusCell.vue', () => {
  it('should render StatusBadge and pass the value as a lowercase status prop', () => {
    const mockValue = 'Complete';

    const wrapper = shallowMount(ScanHistoryStatusCell, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('complete');
  });

  it('should handle already lowercase values', () => {
    const mockValue = 'failed';

    const wrapper = shallowMount(ScanHistoryStatusCell, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('failed');
  });

  it('should handle mixed case values', () => {
    const mockValue = 'InProgress';

    const wrapper = shallowMount(ScanHistoryStatusCell, { props: { value: mockValue } });

    const badge = wrapper.findComponent(StatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('status')).toBe('inprogress');
  });
});
