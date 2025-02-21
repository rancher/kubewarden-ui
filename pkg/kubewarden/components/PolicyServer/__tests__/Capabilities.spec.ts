import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Capabilities from '@kubewarden/components/PolicyServer/Capabilities.vue';
import ArrayList from '@shell/components/form/ArrayList';

const commonMocks = {
  $fetchState: { pending: false },
  $store:      { getters: { 'i18n/t': jest.fn() } }
};


describe('component: Capabilities', () => {
  const createWrapper = (overrides?: any) => {
    return mount(Capabilities, {
      global: { mocks: commonMocks },
      ...overrides,
    });
  };

  it('displays Capabilities correctly and should emit the correct event for data update upstream', async() => {
    const currValues = {
      add:  ['add1', 'add2'],
      drop: ['drop1', 'drop2']
    };

    const wrapper = createWrapper({
      props: {
        value:      currValues,
        configType: 'pod'
      }
    });

    const arrayList = wrapper.findComponent(ArrayList);
    const addInput = wrapper.find('[data-testid="ps-config-security-context-pod-capabilities-add-input"]');
    const dropInput = wrapper.find('[data-testid="ps-config-security-context-pod-capabilities-drop-input"]');

    expect(arrayList.exists()).toBe(true);
    expect(addInput.exists()).toBe(true);
    expect(dropInput.exists()).toBe(true);

    wrapper.vm.updateData();
    await wrapper.vm.$nextTick();

    const emitted = wrapper.emitted()['update-capabilities'] as Array<Array<any>>;

    expect(emitted?.length).toBe(1);
    expect(emitted?.[0][0]).toEqual(currValues);
  });
});
