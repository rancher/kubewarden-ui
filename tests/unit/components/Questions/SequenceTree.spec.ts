import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Question from '@kubewarden/components/Questions/index.vue';
import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

import { question, deepQuestion } from '../../templates/questions';

function getGroups(flattenedQuestions) {
  const map = {};
  const defaultGroup = 'Questions';
  let weight = flattenedQuestions.length;

  for ( const q of flattenedQuestions ) {
    const group = q.group || defaultGroup;

    const normalized = group.trim().toLowerCase();
    const name = group;

    if ( !map[normalized] ) {
      map[normalized] = {
        name,
        questions: [],
        weight:    weight--,
      };
    }

    map[normalized].questions.push(q);
  }

  const out = Object.values(map);

  return out;
}

describe('component: SequenceType', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('emits addSeq with question props', () => {
    const wrapper = shallowMount(SequenceType as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { question } });

    wrapper.vm.$emit('addSeq', question);

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([question as Object]);
  });

  it('renders deep sequence when provided multiple sequence_questions', () => {
    const wrapper = shallowMount(SequenceType as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { question: deepQuestion },
      stubs:     { 'deep-component': SequenceType }
    });

    wrapper.vm.$emit('addSeq', { question: wrapper.props().question });

    const flattenedQuestions = deepQuestion.sequence_questions.flatMap(q => q);

    expect(wrapper.findComponent(SequenceType).exists()).toBe(true);

    const parent = mount(Question, {
      propsData: {
        value:           {
          signatures: [
            {
              keylessPrefix: [
                { issuer: 'test-issuer', urlPrefix: 'test-urlPrefix' }
              ]
            }
          ]
        },
        source:          {
          policy: {
            spec: {
              settings: {
                signatures: [{
                  keylessPrefix: [
                    { issuer: 'test-issuer', urlPrefix: 'test-urlPrefix' }
                  ]
                }]
              }
            }
          },
          questions: flattenedQuestions
        },
        targetNamespace: 'default',
      },
      computed:  {
        asTabs: () => false,
        groups: () => getGroups(flattenedQuestions)
      },
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
      stubs: { Tab: { template: '<span />' } }
    });

    expect(parent.findComponent(SequenceType).exists()).toBe(true);
  });
});
