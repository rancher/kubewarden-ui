import { shallowMount } from '@vue/test-utils';
import IdentifiedCVEsPercentageCell from '../IdentifiedCVEsPercentageCell.vue';
import AmountBarBySeverity from '../../components/common/AmountBarBySeverity.vue';

describe('IdentifiedCVEsPercentageCell.vue', () => {
  it('should render IdentifiedCVEsPercentageCell and pass the value prop and isCollapsed=true', () => {
    const mockValue = {
      critical: 5,
      high:     10,
      medium:   1,
      low:      0,
      unknown:  3
    };

    const wrapper = shallowMount(IdentifiedCVEsPercentageCell, { props: { value: mockValue } });

    const amountBarComponent = wrapper.findComponent(AmountBarBySeverity);

    expect(amountBarComponent.exists()).toBe(true);

    expect(amountBarComponent.props('cveAmount')).toEqual(mockValue);
    expect(amountBarComponent.props('isCollapsed')).toBe(true);
  });
});
