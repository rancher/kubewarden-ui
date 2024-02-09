import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SysctlsArrayList from '@kubewarden/components/PolicyServer/SysctlsArrayList.vue';
import ArrayList from '@shell/components/form/ArrayList';
import { LabeledInput } from '@components/Form/LabeledInput';

describe('component: SysctlsArrayList', () => {
  it('displays SysctlsArrayList correctly and should emit the correct event for data update upstream', async() => {
    const currValues = [
      {
        name:  'name1',
        value: 'value1'
      },
      {
        name:  'name2',
        value: 'value2'
      },
    ];

    const wrapper = mount(SysctlsArrayList as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        value:      currValues,
        configType: 'container',
        inputLabel: {
          name:  'name-label',
          value: 'value-label',
        },
        inputPlaceholderLabel: {
          name:  'name-placeholder-label',
          value: 'value-placeholder-label',
        },
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const textInput = wrapper.findComponent(LabeledInput);
    const arrayListInput = wrapper.findComponent(ArrayList);
    const nameInput = wrapper.find('[data-testid="ps-config-security-context-container-sysctls-name-input"]');
    const valueInput = wrapper.find('[data-testid="ps-config-security-context-container-sysctls-value-input"]');

    const addBtn = arrayListInput.find('.footer button');

    expect(textInput.exists()).toBe(true);
    expect(arrayListInput.exists()).toBe(true);
    expect(nameInput.exists()).toBe(true);
    expect(valueInput.exists()).toBe(true);

    addBtn.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['input']?.[0][0]).toEqual([
      {
        name:  'name1',
        value: 'value1'
      },
      {
        name:  'name2',
        value: 'value2'
      },
      {
        name:  '',
        value: ''
      },
    ]);

    const removeAddedRowBtn = arrayListInput.find(`[data-testid="array-list-box2"] .remove button`);

    removeAddedRowBtn.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['input']?.[1][0]).toEqual([
      {
        name:  'name1',
        value: 'value1'
      },
      {
        name:  'name2',
        value: 'value2'
      }
    ]);

    wrapper.vm.updateRow(1, 'name', 'some-other-name');
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['input']?.[2][0]).toEqual([
      {
        name:  'name1',
        value: 'value1'
      },
      {
        name:  'some-other-name',
        value: 'value2'
      }
    ]);
  });
});
