import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

import ArrayQuestion from '@kubewarden/components/Questions/Array.vue';
import ArrayList from '@shell/components/form/ArrayList';

const question = {
  variable:        'myList',
  label:           'My List',
  description:     'A list of values',
  value_multiline: false,
};

const store = {
  getters: {
    'i18n/t':            (key: string) => key,
    'i18n/withFallback': jest.fn(() => ''),
  },
};

// Parent component that wraps ArrayQuestion so we can test it in context
const ParentComponent = defineComponent({
  components: { ArrayQuestion },
  template:   `
    <ArrayQuestion
      :question="question"
      :value="value"
      :mode="mode"
      :disabled="false"
      @update:value="value = $event"
    />
  `,
  data() {
    return {
      question,
      value: [] as string[],
      mode:  'edit',
    };
  },
});

describe('Questions/Array.vue', () => {
  it('renders an ArrayList inside the parent wrapper', () => {
    const wrapper = mount(ParentComponent, { global: { mocks: { $store: store } } });

    expect(wrapper.findComponent(ArrayList).exists()).toBe(true);
  });

  it('passes add-label as the generic.add i18n key to ArrayList', () => {
    const wrapper = mount(ParentComponent, { global: { mocks: { $store: store } } });

    const arrayList = wrapper.findComponent(ArrayList);

    expect(arrayList.props('addLabel')).toBe('%generic.add%');
  });

  it('passes the question label as title to ArrayList', () => {
    const wrapper = mount(ParentComponent, { global: { mocks: { $store: store } } });

    const arrayList = wrapper.findComponent(ArrayList);

    expect(arrayList.props('title')).toBe(question.label);
  });

  it('emits update:value when ArrayList emits update:value', async() => {
    const wrapper = mount(ParentComponent, { global: { mocks: { $store: store } } });

    const arrayQuestion = wrapper.findComponent(ArrayQuestion);
    const arrayList = wrapper.findComponent(ArrayList);

    await arrayList.vm.$emit('update:value', ['foo', 'bar']);
    await wrapper.vm.$nextTick();

    const emitted = arrayQuestion.emitted('update:value') as string[][];

    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual(['foo', 'bar']);
  });
});
