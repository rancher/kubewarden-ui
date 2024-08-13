import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount, mount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';

import PolicyTable from '@kubewarden/components/Policies/PolicyTable.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { policyPackages } from '@tests/unit/_templates_/policyPackages';
import schemas from '@tests/unit/_templates_/schemas.js';

const defaultComputed = { allSchemas: jest.fn() };
const defaultMocks = {
  $store: {
    getters: {
      'i18n/t':                                jest.fn(),
      'prefs/get':                             () => false,
      'resource-fetch/manualRefreshIsLoading': jest.fn()
    },
  },
};
const defaultProvide = { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY };
const defaultStubs = {
  PolicyTableBadges:    { template: '<span />' },
  PolicyTableFeatures:  { template: '<span />' },
  PolicyTableResources: { template: '<span />' },
  'v-select':           { template: '<span />' }
};

describe('component: PolicyTable', () => {
  it('renders custom policy button even when packages are empty', () => {
    const wrapper = shallowMount(
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData: { value: [] },
        mocks:     defaultMocks,
        provide:   defaultProvide,
        computed:  defaultComputed
      }
    );

    const customButton = wrapper.find('[data-testid="kw-table-custom-buttom"]');

    expect(customButton.exists()).toBe(true);
  });

  it('renders provided packages', () => {
    const wrapper = mount(
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { value: policyPackages },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
        stubs:      defaultStubs
      }
    );

    expect(wrapper.html()).toContain(policyPackages[0].display_name);
  });

  it('filters shown cards by official checkbox', async() => {
    const wrapper = mount(
        PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
        {
          propsData:  { value: policyPackages },
          mocks:      defaultMocks,
          provide:    defaultProvide,
          computed:   defaultComputed,
          stubs:      defaultStubs
        }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Deprecated API Versions');
    expect(wrapper.html()).toContain('PSA Label Enforcer');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ showKubewardenOfficial: false });

    expect(wrapper.html()).toContain('Test Policy 2');
  });

  it('filters shown cards by name when searched', async() => {
    const wrapper = mount(
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { value: policyPackages },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
        stubs:      defaultStubs
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Deprecated API Versions');
    expect(wrapper.html()).toContain('PSA Label Enforcer');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ searchQuery: 'compliance' });

    expect(wrapper.html()).not.toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Deprecated API Versions');
    expect(wrapper.html()).not.toContain('PSA Label Enforcer');
  });

  it('filters shown cards by keywords when searched', async() => {
    const wrapper = mount(
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { value: policyPackages },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
        stubs:      defaultStubs
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Deprecated API Versions');
    expect(wrapper.html()).toContain('PSA Label Enforcer');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ searchQuery: 'Allow' });

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).not.toContain('Deprecated API Versions');
    expect(wrapper.html()).not.toContain('PSA Label Enforcer');
  });

  it('renders correct resource options in LabeledSelect', () => {
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
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { value: policyPackages },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
      }
    );

    const select = wrapper.findComponent(LabeledSelect);

    // Flatten the select options to not include the group headers
    const receivedOptions = select.props().options.filter(option => typeof option === 'string');

    options.forEach((option) => {
      expect(receivedOptions).toContain(option);
    });
  });

  it('filters shown cards by resources when selected', async() => {
    const wrapper = mount(
      PolicyTable as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>,
      {
        propsData:  { value: policyPackages },
        mocks:      defaultMocks,
        provide:    defaultProvide,
        computed:   defaultComputed,
        stubs:      defaultStubs
      }
    );

    expect(wrapper.html()).toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).toContain('Deprecated API Versions');
    expect(wrapper.html()).toContain('PSA Label Enforcer');

    await wrapper.vm.$nextTick();
    await wrapper.setData({ attributes: ['Namespace'] });

    expect(wrapper.html()).toContain('PSA Label Enforcer');
    expect(wrapper.html()).not.toContain('Allow Privilege Escalation PSP');
    expect(wrapper.html()).not.toContain('Deprecated API Versions');
  });

  it('excludes release candidates when showPreRelease is false', () => {
    const wrapper = shallowMount(PolicyTable, {
      propsData:  { value: policyPackages },
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
    const wrapper = shallowMount(PolicyTable, {
      propsData:  { value: policyPackages },
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
    const wrapper = shallowMount(PolicyTable, {
      propsData:  { value: policyPackages },
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
});
