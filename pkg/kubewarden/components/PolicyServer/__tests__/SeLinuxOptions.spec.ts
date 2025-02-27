import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SeLinuxOptions from '@kubewarden/components/PolicyServer/SeLinuxOptions.vue';
import { LabeledInput } from '@components/Form/LabeledInput';

const commonMocks = {
  $fetchState: { pending: false },
  $store:      { getters: { 'i18n/t': jest.fn() } }
};

describe('component: SeLinuxOptions', () => {
  const createWrapper = (overrides?: any) => {
    return mount(SeLinuxOptions, {
      global: { mocks: commonMocks },
      ...overrides,
    });
  };

  it('displays SeLinuxOptions correctly and should emit the correct event for data update upstream', async() => {
    const currValues = {
      level: 'some-level',
      role:  'some-role',
      type:  'some-type',
      user:  'some-user'
    };

    const wrapper = createWrapper({
      props: {
        value:      currValues,
        configType: 'pod'
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

    const emitted = wrapper.emitted()['update-se-linux-options'] as Array<Array<any>>;

    expect(emitted?.length).toBe(1);
    expect(emitted?.[0][0]).toEqual(currValues);
  });
});
