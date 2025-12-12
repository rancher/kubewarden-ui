import { shallowMount } from '@vue/test-utils';
import IdentifiedCVEsCell from '../IdentifiedCVEsCell.vue';
import AmountBarBySeverity from '../../components/common/AmountBarBySeverity.vue';

describe('IdentifiedCVEsCell.vue', () => {
  it('should render AmountBarBySeverity and pass the value prop correctly', () => {
    const mockValue = {
      critical: 1,
      high:     2,
      medium:   3,
      low:      4,
      unknown:  5
    };

    const wrapper = shallowMount(IdentifiedCVEsCell, { props: { value: mockValue } });

    const amountBarComponent = wrapper.findComponent(AmountBarBySeverity);

    expect(amountBarComponent.exists()).toBe(true);

    expect(amountBarComponent.props('cveAmount')).toEqual(mockValue);
    expect(amountBarComponent.props('isCollapsed')).toBe(false);
  });
});
