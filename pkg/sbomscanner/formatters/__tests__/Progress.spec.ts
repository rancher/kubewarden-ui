import { shallowMount } from '@vue/test-utils';
import Progress from '../Progress.vue';

describe('Progress.vue', () => {
  it('should render the percentage when value is greater than zero', () => {
    const mockValue = 50;

    const wrapper = shallowMount(Progress, { props: { value: mockValue } });

    const text = wrapper.find('.progress-text');

    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('50%');
    expect(text.classes()).not.toContain('text-muted');
    expect(text.classes()).not.toContain('none');
  });

  it('should render "n/a" when value is 0', () => {
    const mockValue = 0;

    const wrapper = shallowMount(Progress, { props: { value: mockValue } });

    const text = wrapper.find('.progress-text');

    expect(text.exists()).toBe(true);
    expect(text.text()).toBe('n/a');
    expect(text.classes()).toContain('text-muted');
    expect(text.classes()).toContain('none');
  });
});
