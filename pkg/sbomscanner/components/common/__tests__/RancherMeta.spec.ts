import { shallowMount } from '@vue/test-utils';
import RancherMeta from '../RancherMeta.vue';
import RancherMetaProperty from '../RancherMetaProperty.vue';

describe('RancherMeta.vue', () => {
  const mockProperties = [
    { label: 'Prop 1', value: 'Value 1' },
    { label: 'Prop 2', value: 'Value 2' },
  ];

  it('renders the correct number of RancherMetaProperty components', () => {
    const wrapper = shallowMount(RancherMeta, {
      propsData: { properties: mockProperties },
      stubs:     { RancherMetaProperty }
    });
    const properties = wrapper.findAllComponents(RancherMetaProperty);

    expect(properties.length).toBe(mockProperties.length);
  });

  it('passes the correct property prop to each RancherMetaProperty', () => {
    const wrapper = shallowMount(RancherMeta, {
      propsData: { properties: mockProperties },
      stubs:     { RancherMetaProperty }
    });
    const propertyComponents = wrapper.findAllComponents(RancherMetaProperty);

    propertyComponents.forEach((comp, index) => {
      expect(comp.props('property')).toEqual(mockProperties[index]);
    });
  });

  it('applies the rancher-meta class when isGrid is true', () => {
    const wrapper = shallowMount(RancherMeta, {
      propsData: { isGrid: true },
      stubs:     { RancherMetaProperty }
    });

    expect(wrapper.classes()).toContain('rancher-meta');
  });

  it('applies the rancher-meta class by default', () => {
    const wrapper = shallowMount(RancherMeta, { stubs: { RancherMetaProperty } });

    expect(wrapper.classes()).toContain('rancher-meta');
  });

  it('does not apply the rancher-meta class when isGrid is false', () => {
    const wrapper = shallowMount(RancherMeta, {
      propsData: { isGrid: false },
      stubs:     { RancherMetaProperty }
    });

    expect(wrapper.classes()).not.toContain('rancher-meta');
  });

  it('renders no RancherMetaProperty components when properties array is empty', () => {
    const wrapper = shallowMount(RancherMeta, {
      propsData: { properties: [] },
      stubs:     { RancherMetaProperty }
    });
    const properties = wrapper.findAllComponents(RancherMetaProperty);

    expect(properties.length).toBe(0);
  });
});
