import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SequenceType from '@kubewarden/components/Questions/SequenceTree.vue';
import IntType from '@shell/components/Questions/Int.vue';
import YamlEditor from '@shell/components/YamlEditor';

import { question, deepQuestion } from './templates/questions';

describe('component: SequenceType', () => {
  it('emits addSeq with question props', async() => {
    const wrapper = shallowMount(SequenceType, { propsData: { question } });

    wrapper.vm.$emit('addSeq', question);

    await wrapper.vm.$nextTick();

    expect(wrapper.emitted().addSeq).toBeTruthy();
    expect(wrapper.emitted().addSeq?.[0]).toEqual([question]);
  });

  it('renders IntType component when passed an int question', async() => {
    const wrapper = shallowMount(SequenceType, { propsData: { question } });

    await wrapper.vm.$nextTick();

    const intType = wrapper.findComponent(IntType);

    expect(intType.props().question.type).toBe('int');
  });

  it('renders YamlEditor when passed deep sequence', async() => {
    const wrapper = shallowMount(SequenceType, { propsData: { question: deepQuestion } });

    await wrapper.vm.$nextTick();

    const yamlEditor = wrapper.findComponent(YamlEditor);

    expect(yamlEditor).toBeTruthy();
  });
});
