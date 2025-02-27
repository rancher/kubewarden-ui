import { mount } from '@vue/test-utils';

import SeccompProfile, { SECCOMP_OPTIONS } from '@kubewarden/components/PolicyServer/SeccompProfile.vue';
import { LabeledInput } from '@components/Form/LabeledInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

const commonMocks = {
  $fetchState: { pending: false },
  $store:      { getters: { 'i18n/t': jest.fn() } }
};

const commonStubs = { LabeledTooltip: true };

describe('component: SeccompProfile', () => {
  const createWrapper = (overrides?: any) => {
    return mount(SeccompProfile, {
      global: {
        mocks: commonMocks,
        stubs: commonStubs
      },
      ...overrides,
    });
  };

  it('displays SeccompProfile correctly with empty strings passed to "value" object properties', () => {
    const currValues = {
      localhostProfile: '',
      type:             ''
    };

    const wrapper = createWrapper({
      props: {
        value:      currValues,
        configType: 'pod'
      }
    });

    // inputs should be disabled by default if no data is provided
    expect(wrapper.vm.seccompProfileEnabled).toBe(false);

    const textInput = wrapper.findComponent(LabeledInput);
    const selectInput = wrapper.findComponent(LabeledSelect);
    const textInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-pod-seccompProfile-localhostProfile-input"]');
    const selectInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-pod-seccompProfile-type-input"]');

    expect(textInput.exists()).toBe(false);
    expect(selectInput.exists()).toBe(false);
    expect(textInputSelector.exists()).toBe(false);
    expect(selectInputSelector.exists()).toBe(false);
  });

  it('displays SeccompProfile correctly and should emit the correct event for data update upstream', async() => {
    const currValues = {
      localhostProfile: 'some-localhost-profile',
      type:             SECCOMP_OPTIONS.LOCALHOST
    };

    const wrapper = createWrapper({ props: { value: currValues } });

    const textInput = wrapper.findComponent(LabeledInput);
    const selectInput = wrapper.findComponent(LabeledSelect);
    const textInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-container-seccompProfile-localhostProfile-input"]');
    const selectInputSelector = wrapper.find('[data-testid="ps-config-security-context-container-container-seccompProfile-type-input"]');

    expect(textInput.exists()).toBe(true);
    expect(selectInput.exists()).toBe(true);
    expect(textInputSelector.exists()).toBe(true);
    expect(selectInputSelector.exists()).toBe(true);

    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted()['update-seccomp-profile'] as Array<Array<any>>;

    expect(emitted?.length).toBe(1);
    expect(emitted?.[0][0]).toEqual(currValues);
  });

  it('setting "type" as something other than "Localhost" should clear "localhostProfile" input', async() => {
    const currValues = {
      localhostProfile: 'some-localhost-profile',
      type:             SECCOMP_OPTIONS.RUNTIME_DEFAULT
    };

    const wrapper = createWrapper({
      props: {
        value:      currValues,
        configType: 'pod'
      }
    });

    // this will test that logic as it's bound to "updateData" method
    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted()['update-seccomp-profile'] as Array<Array<any>>;

    expect(emitted?.length).toBe(1);
    expect(emitted?.[0][0]).toEqual({
      localhostProfile: '',
      type:             SECCOMP_OPTIONS.RUNTIME_DEFAULT
    });
  });
});
