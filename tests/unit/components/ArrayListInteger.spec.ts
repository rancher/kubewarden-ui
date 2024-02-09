import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import ArrayListInteger from '@kubewarden/components/ArrayListInteger.vue';
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';

describe('component: ArrayListInteger', () => {
  it('displays ArrayListInteger correctly and should emit the correct event for data update upstream', async() => {
    const currValues = [1, 2, 3];

    const wrapper = mount(ArrayListInteger as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        value:      currValues,
        configType: 'container'
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const textInput = wrapper.findComponent(LabeledInput);
    const arrayListInput = wrapper.findComponent(ArrayList);
    const numberInput = wrapper.find('[data-testid="array-list-integer-input"]');

    expect(textInput.exists()).toBe(true);
    expect(arrayListInput.exists()).toBe(true);
    expect(numberInput.exists()).toBe(true);

    wrapper.vm.updateRow(1, 22222);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['input']?.[0][0]).toEqual([1, 22222, 3]);
  });
});
