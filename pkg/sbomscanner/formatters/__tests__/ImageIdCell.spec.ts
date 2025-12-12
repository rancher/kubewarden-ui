import { shallowMount } from '@vue/test-utils';
import ImageIdCell from '../ImageIdCell.vue';

describe('ImageIdCell.vue', () => {
  it('should render the truncated image ID', () => {
    const mockId = 'sha256:abcdefghijklmnopqrstuvwxyz123456';
    const expectedText = 'abcdefghijkl...';

    const wrapper = shallowMount(ImageIdCell, { props: { value: mockId } });

    const span = wrapper.find('span');

    expect(span.exists()).toBe(true);
    expect(span.text()).toBe(expectedText);
  });

  it('should handle IDs shorter than 12 characters after splitting', () => {
    const mockId = 'digest:1234567890';
    const expectedText = '1234567890...';

    const wrapper = shallowMount(ImageIdCell, { props: { value: mockId } });

    expect(wrapper.text()).toBe(expectedText);
  });
});
