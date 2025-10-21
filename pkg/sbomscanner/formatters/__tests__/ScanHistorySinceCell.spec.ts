import { shallowMount } from '@vue/test-utils';
import ScanHistorySinceCell from '../ScanHistorySinceCell.vue';
import Date from '@shell/components/formatter/Date';

describe('ScanHistorySinceCell.vue', () => {
  it('should render the Date component and pass the value prop to it', () => {
    const mockDateString = '2025-10-20T18:00:00Z';

    const wrapper = shallowMount(ScanHistorySinceCell, { props: { value: mockDateString } });

    const dateComponent = wrapper.findComponent(Date);

    expect(dateComponent.exists()).toBe(true);

    expect(dateComponent.props('value')).toBe(mockDateString);
  });
});
