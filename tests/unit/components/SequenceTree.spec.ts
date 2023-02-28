import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';

import { question } from '../templates/questions';

describe('component: SequenceType', () => {
  it('emits addSeq with question props', async() => {
    const wrapper = shallowMount(SequenceType as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, { propsData: { question } });

    wrapper.vm.$emit('addSeq', question);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([question as Object]);
  });
});
