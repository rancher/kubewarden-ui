import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SeLinuxOptions from '@kubewarden/components/PolicyServer/SeLinuxOptions.vue';
import { LabeledInput } from '@components/Form/LabeledInput';

describe('component: SeLinuxOptions', () => {
  it('displays SeLinuxOptions correctly and should emit the correct event for data update upstream', async() => {
    const currValues = {
      level: 'some-level', role: 'some-role', type: 'some-type', user: 'some-user'
    };

    const wrapper = shallowMount(SeLinuxOptions as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: currValues, configType: 'pod' },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const textInput = wrapper.findComponent(LabeledInput);
    const levelInput = wrapper.find('[data-testid="ps-config-security-context-pod-seLinuxOptions-level-input"]');
    const roleInput = wrapper.find('[data-testid="ps-config-security-context-pod-seLinuxOptions-role-input"]');
    const typeInput = wrapper.find('[data-testid="ps-config-security-context-pod-seLinuxOptions-type-input"]');
    const userInput = wrapper.find('[data-testid="ps-config-security-context-pod-seLinuxOptions-user-input"]');

    expect(textInput.exists()).toBe(true);
    expect(levelInput.exists()).toBe(true);
    expect(roleInput.exists()).toBe(true);
    expect(typeInput.exists()).toBe(true);
    expect(userInput.exists()).toBe(true);

    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['update-se-linux-options']?.length).toBe(1);
    expect(wrapper.emitted()['update-se-linux-options']?.[0][0]).toEqual(currValues);
  });
});
