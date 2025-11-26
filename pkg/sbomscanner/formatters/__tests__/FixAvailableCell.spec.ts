import { shallowMount } from '@vue/test-utils';
import FixAvailableCell from '../FixAvailableCell.vue';
import FixAvailableIcon from '@sbomscanner/components/common/FixAvailableIcon';

describe('FixAvailableCell.vue', () => {
  it('should render a success icon and fix version when fix is available', () => {
    const mockRow = {
      fixAvailable: true,
      fixVersion:   '1.2.3-patch'
    };

    const wrapper = shallowMount(FixAvailableCell, { props: { row: mockRow } });

    const icon = wrapper.findComponent(FixAvailableIcon);

    expect(icon.exists()).toBe(true);
    expect(icon.props('fixAvailable')).toBe(true);

    const span = wrapper.find('span');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe(mockRow.fixVersion);
  });

  it('should render only the success icon when fix is available but no version is specified', () => {
    const mockRow = {
      fixAvailable: true,
      fixVersion:   null,
    };

    const wrapper = shallowMount(FixAvailableCell, { props: { row: mockRow } });

    const icon = wrapper.findComponent(FixAvailableIcon);

    expect(icon.exists()).toBe(true);
    expect(icon.props('fixAvailable')).toBe(true);

    const span = wrapper.find('span');

    expect(span.exists()).toBe(false);
  });

  it('should render an error icon and no version when fix is not available', () => {
    const mockRow = {
      fixAvailable: false,
      fixVersion:   '1.2.3-patch',
    };

    const wrapper = shallowMount(FixAvailableCell, { props: { row: mockRow } });

    const icon = wrapper.findComponent(FixAvailableIcon);

    expect(icon.exists()).toBe(true);
    expect(icon.props('fixAvailable')).toBe(false);

    const span = wrapper.find('span');

    expect(span.exists()).toBe(false);
  });
});
