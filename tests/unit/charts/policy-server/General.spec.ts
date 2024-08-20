import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import General from '@kubewarden/chart/kubewarden/policy-server/General.vue';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

import { fleetBundles as bundles } from '@tests/unit/_templates_/fleetBundles';
import { mockControllerAppWithFleet } from '@tests/unit/_templates_/controllerApp';

jest.mock('@kubewarden/modules/fleet', () => ({
  getPolicyServerModule: jest.requireActual('@kubewarden/modules/fleet').getPolicyServerModule,
  isFleetDeployment:     jest.requireActual('@kubewarden/modules/fleet').isFleetDeployment,
  findFleetContent:      jest.requireActual('@kubewarden/modules/fleet').findFleetContent
}));

jest.mock('@shell/mixins/resource-fetch', () => ({
  methods: {
    __getCountForResource: jest.fn().mockReturnValue(0),
    $initializeFetchData:  jest.fn(),
    $fetchType:            jest.fn()
  }
}));

describe('component: General', () => {
  it('displays service account options', () => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, serviceAccounts },
      computed:  {
        isCreate:      () => false,
        defaultsChart: () => null
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs:     {
        LabeledInput:      { template: '<span />' },
        RadioGroup:        { template: '<span />' }
      }
    });

    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props().options).toStrictEqual(serviceAccounts as String[]);
  });

  it('displays correct service account when existing', () => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const name = { spec: { serviceAccountName: serviceAccounts[1] } };
    const policyServer = { ...DEFAULT_POLICY_SERVER, ...name };

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: policyServer, serviceAccounts },
      computed:  {
        isCreate:      () => false,
        defaultsChart: () => null
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs: { Banner: { template: '<span />' } }
    });

    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props().value).toStrictEqual(serviceAccounts[1] as String);
  });

  it('extracts latestChartVersion when isFleet is true', async() => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];
    const latestChartVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, serviceAccounts },
      computed:  {
        isCreate:      () => false,
        defaultsChart: () => null,
        fleetBundles:  () => bundles,
        controllerApp: () => mockControllerAppWithFleet
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'management/all':             jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs: { Banner: { template: '<span />' } }
    });

    // Wait for the component to be mounted
    await new Promise(resolve => setTimeout(resolve, 1));

    // Check that the latestChartVersion is set correctly
    expect((wrapper.vm as any).latestChartVersion).toBe(latestChartVersion);
  });

  it('hides image-row when isLoading is true', async() => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, serviceAccounts },
      computed:  {
        isCreate:      () => false,
        defaultsChart: () => null
      },
      mocks:     {
        $fetchState: { pending: true }, // Simulate a loading state
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs: { Banner: { template: '<span />' } }
    });

    // Simulate the isLoading being true
    (wrapper.vm as any).isLoading = true;

    await wrapper.vm.$nextTick();

    const imageLoading = wrapper.find('[data-testid="ps-config-image-loading"]');

    expect(imageLoading.exists()).toBe(false);
  });

  it('shows image-row when isLoading is false', async() => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, serviceAccounts },
      computed:  {
        isCreate:      () => false,
        defaultsChart: () => null
      },
      mocks:     {
        $fetchState: { pending: false }, // Simulate a non-loading state
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs: { Banner: { template: '<span />' } }
    });

    // Simulate the isLoading being false
    (wrapper.vm as any).isLoading = false;

    await wrapper.vm.$nextTick();

    const imageInputs = wrapper.find('[data-testid="ps-config-image-inputs"]');

    expect(imageInputs.exists()).toBe(true);
  });

  it('sets defaultImage to true when not isCreate and image matches latestChartVersion', async() => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];
    const latestChartVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: { ...DEFAULT_POLICY_SERVER, spec: { image: latestChartVersion } }, serviceAccounts },
      computed:  {
        isCreate:           () => false,
        defaultsChart:      () => null,
        latestChartVersion: () => latestChartVersion
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'cluster/canList':            () => true,
            'cluster/all':                jest.fn(),
            'management/all':             jest.fn(),
            'i18n/t':                     jest.fn(),
            'management/byId':            jest.fn(),
            'resource-fetch/refreshFlag': jest.fn()
          },
          dispatch: jest.fn()
        }
      },
      stubs: { Banner: { template: '<span />' } }
    });

    // Wait for the component to be mounted
    await new Promise(resolve => setTimeout(resolve, 1));

    // Check that defaultImage is set correctly
    expect((wrapper.vm as any).defaultImage).toBe(true);
  });
});
