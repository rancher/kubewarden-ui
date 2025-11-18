import { shallowMount } from '@vue/test-utils';
import RancherMetaProperty from '../RancherMetaProperty.vue';

describe('RancherMetaProperty.vue', () => {
  describe('when property.type is "text"', () => {
    it('should render both label and value', () => {
      const property = {
        type: 'text', label: 'Label', value: 'Value'
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      const label = wrapper.find('.label');
      const value = wrapper.find('.value');

      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Label');
      expect(value.exists()).toBe(true);
      expect(value.text()).toBe('Value');
      expect(wrapper.find('.link').exists()).toBe(false);
      expect(wrapper.find('.tags').exists()).toBe(false);
    });

    it('should render only value if label is null', () => {
      const property = {
        type: 'text', label: null, value: 'Value'
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      const label = wrapper.find('.label');
      const value = wrapper.find('.value');

      expect(label.exists()).toBe(false);
      expect(value.exists()).toBe(true);
      expect(value.text()).toBe('Value');
    });

    it('should render only label if value is null', () => {
      const property = {
        type: 'text', label: 'Label', value: null
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      const label = wrapper.find('.label');
      const value = wrapper.find('.value');

      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Label');
      expect(value.exists()).toBe(false);
    });
  });

  describe('when property.type is "link"', () => {
    it('should render both label and link', () => {
      const property = {
        type: 'link', label: 'Website', value: 'example.com'
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      const label = wrapper.find('.label');
      const link = wrapper.find('.link');

      expect(label.exists()).toBe(true);
      expect(label.text()).toBe('Website');
      expect(link.exists()).toBe(true);
      expect(link.text()).toBe('example.com');
      expect(wrapper.find('.value').exists()).toBe(false);
    });

    it('should render only link if label is null', () => {
      const property = {
        type: 'link', label: null, value: 'example.com'
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      expect(wrapper.find('.label').exists()).toBe(false);
      expect(wrapper.find('.link').exists()).toBe(true);
      expect(wrapper.find('.link').text()).toBe('example.com');
    });

    it('should render only label if value is null', () => {
      const property = {
        type: 'link', label: 'Website', value: null
      };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      expect(wrapper.find('.label').exists()).toBe(true);
      expect(wrapper.find('.label').text()).toBe('Website');
      expect(wrapper.find('.link').exists()).toBe(false);
    });
  });

  describe('when property.type is "tags"', () => {
    it('should render all tags', () => {
      const tags = ['Tag 1', 'Tag 2', 'Tag 3'];
      const property = { type: 'tags', tags };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      const tagElements = wrapper.findAll('.tag-text');

      expect(tagElements.length).toBe(3);
      tagElements.forEach((el, i) => {
        expect(el.text()).toBe(tags[i]);
      });
      expect(wrapper.find('.text').exists()).toBe(false);
    });

    it('should render no tags for an empty array', () => {
      const property = { type: 'tags', tags: [] };
      const wrapper = shallowMount(RancherMetaProperty, { propsData: { property } });

      expect(wrapper.findAll('.tag-text').length).toBe(0);
    });
  });
});
