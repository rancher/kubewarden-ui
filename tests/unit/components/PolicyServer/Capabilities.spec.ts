import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Capabilities from '@kubewarden/components/PolicyServer/Capabilities.vue';
import ArrayList from '@shell/components/form/ArrayList';

describe('component: Capabilities', () => {
  it('displays Capabilities correctly and should emit the correct event for data update upstream', async() => {
    const currValues = { add: ['add1', 'add2'], drop: ['drop1', 'drop2'] };

    const wrapper = shallowMount(Capabilities as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: currValues, configType: 'pod' },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const arrayList = wrapper.findComponent(ArrayList);
    const addInput = wrapper.find('[data-testid="ps-config-security-context-pod-capabilities-add-input"]');
    const dropInput = wrapper.find('[data-testid="ps-config-security-context-pod-capabilities-drop-input"]');

    expect(arrayList.exists()).toBe(true);
    expect(addInput.exists()).toBe(true);
    expect(dropInput.exists()).toBe(true);

    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['update-capabilities']?.length).toBe(1);
    expect(wrapper.emitted()['update-capabilities']?.[0][0]).toEqual(currValues);
  });
});
