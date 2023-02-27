import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

const props = {
  question: {
    default:            [],
    tooltip:            'Valid user ID (UID) ranges for the fsGroup.',
    group:              'Settings',
    label:              'User ID Ranges',
    type:               'sequence[',
    variable:           'ranges',
    sequence_questions: [
      {
        default:  1000,
        tooltip:  'Minimum UID range for fsgroup.',
        group:    'Settings',
        label:    'min',
        type:     'int',
        variable: 'min'
      }
    ]
  }
};

describe('component: SequenceType', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('emits addSeq with question props', async() => {
    const wrapper = shallowMount(SequenceType, { propsData: props });

    wrapper.vm.$emit('addSeq', props.question);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([props.question]);
  });
});
