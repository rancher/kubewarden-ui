import { mount } from '@vue/test-utils';

import PolicyTableResources from '@kubewarden/formatters/PolicyTableResources.vue';

describe('PolicyTableResources.vue', () => {
  it('renders nothing when the "kubewarden/resources" property is missing', () => {
    const wrapper = mount(PolicyTableResources, { props: { value: {} } });

    expect(wrapper.text()).toBe('');
  });

  it('renders "Multiple" when the resource list contains more than one resource', () => {
    const wrapper = mount(PolicyTableResources, { props: { value: { 'kubewarden/resources': 'foo,bar,baz' } } });

    expect(wrapper.text()).toBe('Multiple');
  });

  it('renders "Global" when the resource list contains a single asterisk ("*")', () => {
    const wrapper = mount(PolicyTableResources, { props: { value: { 'kubewarden/resources': '*' } } });

    expect(wrapper.text()).toBe('Global');
  });

  it('renders the resource string when the resource list contains exactly one resource (that is not "*")', () => {
    const wrapper = mount(PolicyTableResources, { props: { value: { 'kubewarden/resources': 'foo' } } });

    expect(wrapper.text()).toBe('foo');
  });
});
