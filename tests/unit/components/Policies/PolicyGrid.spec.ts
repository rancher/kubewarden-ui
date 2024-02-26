import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';

import PolicyGrid from '@kubewarden/components/Policies/PolicyGrid.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import policyPackages from '@tests/unit/_templates_/policyPackages.js';
import schemas from '@tests/unit/_templates_/schemas.js';

const defaultComputed = { allSchemas: jest.fn() };
const defaultMocks = {
  $store: {
    getters: {
      'i18n/t':    jest.fn(),
      'prefs/get': () => false,
    },
  },
};
const defaultProvide = { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY };

describe('component: PolicyGrid', () => {
  it('should render custom card when provided empty packages', () => {
    const packages: Array<any> = [];
    const customSubtype = `<div>Custom Policy</div>`;

    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData: { targetNamespace: 'default', value: packages },
        mocks:     defaultMocks,
        provide:   defaultProvide,
        computed:  defaultComputed,
        slots:     { customSubtype },
      }
    );

    expect(wrapper.html()).toContain('Custom Policy');
  });

  it('should render provided packages', () => {
    const customSubtype = `<div>Custom Policy</div>`;

    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
        slots:      { customSubtype },
      }
    );

    expect(wrapper.html()).toContain('Custom Policy');
    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
  });

  it('should render correct organization options in LabeledSelect', () => {
    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(0).props().options).toStrictEqual([
      'Kubewarden Developers',
      'honorable',
      'dishonorable',
      'evil',
    ] as String[]);
  });

  it('filters shown cards by organization when selected', async() => {
    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ organizations: ['evil'] });

    expect(wrapper.html()).not.toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Test Policy 2');
  });

  it('should render correct keyword options in LabeledSelect', () => {
    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(1).props().options).toStrictEqual([
      'PSP',
      'privilege escalation',
      'compliance',
      'deprecated API',
      'namespace',
      'psa',
      'kubewarden',
    ] as String[]);
  });

  it('filters shown cards by keywords when selected', async() => {
    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ keywords: ['PSP'], organizations: [] });

    expect(wrapper.html()).not.toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');
  });

  it('should render correct resource options in LabeledSelect', () => {
    const options: String[] = [
      'Deployment',
      'Replicaset',
      'Statefulset',
      'Daemonset',
      'Replicationcontroller',
      'Job',
      'Cronjob',
      'Pod',
      '*',
      'Namespace',
    ];

    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    const selects = wrapper.findAllComponents(LabeledSelect);

    expect(selects.at(2).props().options).toStrictEqual(options as String[]);
  });

  it('filters shown cards by resources when selected', async() => {
    const wrapper = shallowMount(
      PolicyGrid as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { targetNamespace: 'default', value: policyPackages },
        directives: { tooltip: jest.fn() },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ category: ['Daemonset'], organizations: [] });

    expect(wrapper.html()).not.toContain('Signed Test Policy');
    expect(wrapper.html()).toContain('Test Policy 2');
    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
  });

  it('excludes release candidates when showPreRelease is false', () => {
    const wrapper = shallowMount(PolicyGrid, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      defaultMocks,
      provide:    defaultProvide,
      computed:   defaultComputed,
    });

    const filteredPackages = wrapper.vm.filteredPackages;

    const containsRc = filteredPackages.some(
      pkg => pkg.name === 'container-resources'
    );

    expect(containsRc).toBe(false);
  });

  it('includes release candidates when showPreRelease is true', () => {
    const wrapper = shallowMount(PolicyGrid, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      {
        $store: {
          getters: {
            'i18n/t':    jest.fn(),
            'prefs/get': () => true,
          },
        },
      },
      provide:  defaultProvide,
      computed: defaultComputed,
    });

    const filteredPackages = wrapper.vm.filteredPackages;
    const containsRc = filteredPackages.some(
      pkg => pkg.name === 'container-resources'
    );

    expect(containsRc).toBe(true);
  });

  it('includes deprecated-api-versions policy when showPreRelease is false', () => {
    const wrapper = shallowMount(PolicyGrid, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      {
        $store: {
          getters: {
            'i18n/t':    jest.fn(),
            'prefs/get': () => false,
          },
        },
      },
      provide:  defaultProvide,
      computed: defaultComputed,
    });

    const filteredPackages = wrapper.vm.filteredPackages;
    const containsRc = filteredPackages.some(
      pkg => pkg.name === 'deprecated-api-versions'
    );

    expect(containsRc).toBe(true);
  });

  it('should hide policies defined as cluster admission policies when creating admission policy', () => {
    const wrapper = shallowMount(PolicyGrid, {
      propsData:  { targetNamespace: 'default', value: policyPackages },
      directives: { tooltip: jest.fn() },
      mocks:      defaultMocks,
      provide:    { chartType: KUBEWARDEN.ADMISSION_POLICY },
      computed:   { allSchemas: () => schemas },
    });

    const filteredPackages = wrapper.vm.filteredPackages;
    const containsCap = filteredPackages.some(
      pkg => pkg.name === 'psa-label-enforcer'
    );

    expect(containsCap).toBe(false);
  });
});
