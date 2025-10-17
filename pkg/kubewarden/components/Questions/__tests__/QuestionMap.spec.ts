import { mount } from '@vue/test-utils';

import Question from '@kubewarden/components/Questions/index.vue';
import QuestionMap from '@kubewarden/components/Questions/QuestionMap.vue';
import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

import { deepMapQuestion } from '@/tests/unit/mocks/questions';

const commonMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      currentStore:           () => 'current_store',
      'current_store/all':    jest.fn(),
      'i18n/t':               jest.fn(),
      'i18n/withFallback':    () => 'fallback',
    },
  }
};

const commonStubs = {
  'v-select':     { template: '<span />' },
  LabeledTooltip: { template: '<span />' },
  Tab: { template: '<div class="tab-stub"><slot /></div>' },
  ArrayList: {
    template: '<div class="array-list-stub"><slot name="columns" :row="{value: \'test\'}" :i="0"></slot></div>',
    props: ['value', 'addAllowed', 'addLabel', 'disabled', 'defaultAddValue'],
    emits: ['update:value']
  }
};

const createWrapper = (component: any, overrides?: any) => {
  return mount(component, {
    global: {
      mocks:   commonMocks,
      stubs:   commonStubs,
      provide: {
        addTab:    jest.fn(),       // provide a mock function for addTab
        removeTab: jest.fn(),    // provide a mock function for removeTab
        sideTabs:  false          // or provide whatever value is expected
      }
    },
    ...overrides,
  });
};


describe('component: QuestionMap', () => {
  it('emits addSeq with question props', () => {
    const wrapper = createWrapper(QuestionMap, { props: { question: deepMapQuestion } });

    wrapper.vm.$emit('addSeq', deepMapQuestion);

    const emitted = wrapper.emitted().addSeq as Array<any>;

    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([deepMapQuestion as object]);
  });
});

describe('component: Question', () => {
  it('renders sequence type when nested within a map subquestion', () => {
    const wrapper = createWrapper(Question, {
      props: {
        value:           {
          run_as_user: {
            rule:   'MustRunAs',
            ranges: [{
              min: 1000,
              max: 2000
            }]
          }
        },
        source:          {
          policy:    {
            spec: {
              settings: {
                run_as_user: {
                  rule:   'MustRunAs',
                  ranges: [{
                    min: 1000,
                    max: 2000
                  }]
                }
              }
            }
          },
          questions: deepMapQuestion
        },
        targetNamespace: 'default',
      }
    });

    const sequence = wrapper.findComponent(SequenceType);


    expect(sequence.exists()).toBe(true);
    expect(sequence.props().question?.variable).toStrictEqual('run_as_user.ranges' as string);

    const wrapperProps = wrapper.props() as { value?: { run_as_user?: { ranges?: Array<object> } } };

    expect(sequence.props().value).toStrictEqual(wrapperProps.value?.run_as_user?.ranges);
  });
});
