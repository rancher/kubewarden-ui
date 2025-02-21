import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

import { question, deepSequenceQuestion } from '@/tests/unit/mocks/questions';

const commonMocks = {
  $fetchState: { pending: false },
  $store:      {
    getters: {
      currentStore:           () => 'current_store',
      'current_store/all':    jest.fn(),
      'i18n/t':               jest.fn(),
      'i18n/withFallback':    jest.fn(),
    },
  }
};

const commonStubs = {
  Tab:            { template: '<div><slot/></div>' },
  'v-select':     { template: '<span />' },
  LabeledTooltip: { template: '<span />' }
};

const commonProvide = {
  addTab:    jest.fn(),       // provide a mock function for addTab
  removeTab: jest.fn(),    // provide a mock function for removeTab
  sideTabs:  false          // or provide whatever value is expected
};

const createWrapper = (component: any, overrides?: any) => {
  return mount(component, {
    global: {
      mocks:   commonMocks,
      stubs:   commonStubs,
      provide: commonProvide
    },
    ...overrides,
  });
};

describe('component: SequenceType', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('emits addSeq with question props', () => {
    const wrapper = createWrapper(SequenceType, { props: { question } });

    wrapper.vm.$emit('addSeq', question);

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([question as object]);
  });

  it('renders deep sequence when provided multiple sequence_questions', () => {
    const wrapper = createWrapper(SequenceType, {
      props:  { question: deepSequenceQuestion },
      global: {
        mocks:      commonMocks,
        stubs:      commonStubs,
        provide:    commonProvide,
        components: { SequenceType }
      }
    });

    wrapper.vm.$emit('addSeq', { question: deepSequenceQuestion });

    expect(wrapper.findComponent(SequenceType).exists()).toBe(true);
  });
});
