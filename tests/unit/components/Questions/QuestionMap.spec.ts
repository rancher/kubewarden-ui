import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Question from '@kubewarden/components/Questions/index.vue';
import QuestionMap from '@kubewarden/components/Questions/QuestionMap.vue';
import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

import { deepMapQuestion } from '../../templates/questions';

describe('component: QuestionMap', () => {
  it('emits addSeq with question props', () => {
    const wrapper = shallowMount(QuestionMap as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { question: deepMapQuestion } });

    wrapper.vm.$emit('addSeq', deepMapQuestion);

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([deepMapQuestion as Object]);
  });

  it('renders sequence type when nested within a map subquestion', () => {
    const wrapper = mount(Question, {
      propsData: {
        value:           { run_as_user: { rule: 'MustRunAs', ranges: [{ min: 1000, max: 2000 }] } },
        source:          {
          policy:    { spec: { settings: { run_as_user: { rule: 'MustRunAs', ranges: [{ min: 1000, max: 2000 }] } } } },
          questions: deepMapQuestion
        },
        targetNamespace: 'default',
      },
      computed:  { asTabs: () => false },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentStore:           () => 'current_store',
            'current_store/all':    jest.fn(),
            'i18n/t':               jest.fn(),
            'i18n/withFallback':    jest.fn()
          },
        }
      },
      stubs: {
        Tab:        { template: '<span />' },
        'v-select': { template: '<span />' }
      }
    });

    const sequence = wrapper.findComponent(SequenceType);

    expect(sequence.exists()).toBe(true);
    expect(sequence.props().question?.variable).toStrictEqual('run_as_user.ranges' as String);
    expect(sequence.props().value).toStrictEqual(wrapper.props().value?.run_as_user?.ranges as Array<Object>);
  });
});
