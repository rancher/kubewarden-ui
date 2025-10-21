import { shallowMount } from '@vue/test-utils';
import VexStatusCellBadge from '../VexStatusCellBadge.vue';
import VexStatusBadge from '@pkg/components/common/VexStatusBadge.vue';

describe('VexStatusCellBadge.vue', () => {
  it.each([
    { value: true, expected: true },
    { value: false, expected: false },
  ])('should pass the value $value to the VexStatusBadge enabled prop', ({ value, expected }) => {
    const wrapper = shallowMount(VexStatusCellBadge, { props: { value } });

    const badge = wrapper.findComponent(VexStatusBadge);

    expect(badge.exists()).toBe(true);
    expect(badge.props('enabled')).toBe(expected);
  });
});
