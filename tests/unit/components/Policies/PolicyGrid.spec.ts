import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import PolicyGrid from '@kubewarden/components/Policies/PolicyGrid.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import policyPackages from '../../templates/policyPackages.js';

describe('component: PolicyGrid', () => {
  it('should render custom card when provided empty packages', () => {
    const packages: Array<any> = [];
    const customSubtype = `<div>Custom Policy</div>`;

    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { targetNamespace: 'default', value: packages },
      mocks:     { $store: { getters: { 'i18n/t': jest.fn() } } },
      slots:     { customSubtype }
    });

    expect(wrapper.html()).toContain('Custom Policy');
  });

  it('should render provided packages', () => {
    const customSubtype = `<div>Custom Policy</div>`;

    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } },
      slots:      { customSubtype }
    });

    expect(wrapper.html()).toContain('Custom Policy');
    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
  });

  it('should render correct organization options in LabeledSelect', () => {
    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(0).props().options).toStrictEqual(['Kubewarden Developers', 'evil'] as String[]);
  });

  it('filters shown cards by organization when selected', async() => {
    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.setData({ organizations: ['evil'] });

    expect(wrapper.html()).not.toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Test Policy 2');
  });

  it('should render correct keyword options in LabeledSelect', () => {
    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } },
    });

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(1).props().options).toStrictEqual(['PSP', 'privilege escalation'] as String[]);
  });

  it('filters shown cards by keywords when selected', async() => {
    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.setData({ keywords: ['PSP'] });

    expect(wrapper.html()).not.toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');
  });

  it('should render correct resource options in LabeledSelect', () => {
    const options: String[] = ['Deployment', 'Replicaset', 'Statefulset', 'Daemonset', 'Replicationcontroller', 'Job', 'Cronjob', 'Pod'];

    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(2).props().options).toStrictEqual(options as String[]);
  });

  it('filters shown cards by resources when selected', async() => {
    const wrapper = shallowMount(PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      { $store: { getters: { 'i18n/t': jest.fn() } } }
    });

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.setData({ category: ['Daemonset'] });

    expect(wrapper.html()).not.toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');
    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
  });
});
