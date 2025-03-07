import { mount } from '@vue/test-utils';

import PolicyTableFeatures from '@kubewarden/formatters/PolicyTableFeatures.vue';

describe('PolicyTableFeatures.vue', () => {
  it('renders nothing when no features are provided', () => {
    const wrapper = mount(PolicyTableFeatures, { props: { value: {} } });

    expect(wrapper.text()).toBe('');
  });

  it('renders "Mutation" when "kubewarden/mutation" is "true"', () => {
    const wrapper = mount(PolicyTableFeatures, { props: { value: { 'kubewarden/mutation': 'true' } } });

    expect(wrapper.text()).toBe('Mutation');
  });

  it('renders "Context Aware" when "kubewarden/contextAwareResources" is truthy', () => {
    const wrapper = mount(PolicyTableFeatures, { props: { value: { 'kubewarden/contextAwareResources': 'foo' } } });

    expect(wrapper.text()).toBe('Context Aware');
  });

  it('renders "Mutation, Context Aware" when both features are provided', () => {
    const wrapper = mount(PolicyTableFeatures, {
      props: {
        value: {
          'kubewarden/mutation':              'true',
          'kubewarden/contextAwareResources': true
        }
      }
    });

    expect(wrapper.text()).toBe('Mutation, Context Aware');
  });
});
