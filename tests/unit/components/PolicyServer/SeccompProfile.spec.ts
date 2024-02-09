import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SeccompProfile from '@kubewarden/components/PolicyServer/SeccompProfile.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

describe('component: SeccompProfile', () => {
  it('displays SeccompProfile correctly and should emit the correct event for data update upstream', async() => {
    const currValues = { localhostProfile: 'some-localhost-profile', type: 'some-type' };

    const wrapper = shallowMount(SeccompProfile as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: currValues, configType: 'pod' },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const textInput = wrapper.findComponent(LabeledInput);
    const selectInput = wrapper.findComponent(LabeledSelect);
    const textInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-pod-seccompProfile-localhostProfile-input"]');
    const selectInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-pod-seccompProfile-type-input"]');

    expect(textInput.exists()).toBe(true);
    expect(selectInput.exists()).toBe(true);
    expect(textInputSelector.exists()).toBe(true);
    expect(selectInputSelector.exists()).toBe(true);

    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['update-seccomp-profile']?.length).toBe(1);
    expect(wrapper.emitted()['update-seccomp-profile']?.[0][0]).toEqual(currValues);
  });
});
