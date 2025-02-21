import { shallowMount } from '@vue/test-utils';


import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import General from '@kubewarden/chart/kubewarden/policy-server/General.vue';
import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

import { fleetBundles as bundles } from '@tests/unit/mocks/fleetBundles';
import { mockControllerAppWithFleet } from '@tests/unit/mocks/controllerApp';

interface FleetModule {
  getPolicyServerModule: (fleetBundles: any[]) => string | null; // eslint-disable-line no-unused-vars
  isFleetDeployment: (app: any) => boolean; // eslint-disable-line no-unused-vars
  findFleetContent: (context: string, fleetBundles: any[], skipChart?: string) => any | null; // eslint-disable-line no-unused-vars
}

// Properly type the actual fleet module in our jest.mock.
jest.mock('@kubewarden/modules/fleet', () => {
  const actual = jest.requireActual('@kubewarden/modules/fleet') as FleetModule;

  return {
    getPolicyServerModule: actual.getPolicyServerModule,
    isFleetDeployment:     actual.isFleetDeployment,
    findFleetContent:      actual.findFleetContent
  };
});

jest.mock('@shell/mixins/resource-fetch', () => ({
  methods: {
    __getCountForResource: jest.fn().mockReturnValue(0),
    $initializeFetchData:  jest.fn(),
    $fetchType:            jest.fn()
  }
}));

// Common defaults for mounting the component.
const defaultMountOptions = {
  props: {
    value:           DEFAULT_POLICY_SERVER,
    serviceAccounts: ['sa-1', 'sa-2', 'sa-3']
  },
  computed: {
    isCreate:          () => false,
    defaultsChart:     () => null,
    showVersionBanner: () => false
  },
  global: {
    mocks: {
      $fetchState: { pending: false },
      $store:      {
        getters: {
          'cluster/canList':            () => true,
          'cluster/all':                jest.fn(),
          'i18n/t':                     jest.fn(),
          'management/byId':            jest.fn(),
          'resource-fetch/refreshFlag': jest.fn(),
          'management/all':             jest.fn(),
        },
        dispatch: jest.fn()
      }
    },
    stubs: {
      LabeledInput:      { template: '<span />' },
      RadioGroup:        { template: '<span />' },
      Banner:            { template: '<span />' },
      ServiceNameSelect: {
        template: '<div />',
        props:    ['value', 'options']
      },
    }
  }
};

// A helper that deep-merges overrides into the default options.
function createWrapper(overrides: any = {}) {
  return shallowMount(General, {
    props: {
      ...defaultMountOptions.props,
      ...(overrides.props || {})
    },
    computed: {
      ...defaultMountOptions.computed,
      ...(overrides.computed || {})
    },
    global: {
      mocks: {
        ...defaultMountOptions.global.mocks,
        ...(overrides.global?.mocks || {})
      },
      stubs: {
        ...defaultMountOptions.global.stubs,
        ...(overrides.global?.stubs || {})
      }
    }
  });
}

describe('component: General', () => {
  it('displays service account options', () => {
    const wrapper = createWrapper();
    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props().options).toStrictEqual(['sa-1', 'sa-2', 'sa-3']);
  });

  it('displays correct service account when existing', async() => {
    // override the value with an existing service account name.
    const policyServer = {
      ...DEFAULT_POLICY_SERVER,
      spec: { serviceAccountName: 'sa-2' }
    };

    const wrapper = createWrapper({ props: { value: policyServer } });
    const selector = wrapper.findComponent(ServiceNameSelect);

    await wrapper.vm.$nextTick();

    expect(selector.props().value).toStrictEqual('sa-2');
  });

  it('extracts latestChartVersion when isFleet is true', async() => {
    const latestChartVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';
    const wrapper = createWrapper({
      computed: {
        fleetBundles:  () => bundles,
        controllerApp: () => mockControllerAppWithFleet
      }
    });

    // Wait a tick for the component to mount and update.
    await new Promise((resolve) => setTimeout(resolve, 1));

    expect((wrapper.vm as any).latestChartVersion).toBe(latestChartVersion);
  });

  it('hides image-row when isLoading is true', async() => {
    const wrapper = createWrapper({ global: { mocks: { $fetchState: { pending: true } } } });

    // Set the isLoading flag.
    (wrapper.vm as any).isLoading = true;
    await wrapper.vm.$nextTick();

    const imageLoading = wrapper.find('[data-testid="ps-config-image-loading"]');

    expect(imageLoading.exists()).toBe(false);
  });

  it('shows image-row when isLoading is false', async() => {
    const wrapper = createWrapper();

    (wrapper.vm as any).isLoading = false;
    await wrapper.vm.$nextTick();

    const imageInputs = wrapper.find('[data-testid="ps-config-image-inputs"]');

    expect(imageInputs.exists()).toBe(true);
  });

  it('sets defaultImage to true when not isCreate and image matches latestChartVersion', async() => {
    const latestChartVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';
    const wrapper = createWrapper({
      props: {
        value: {
          ...DEFAULT_POLICY_SERVER,
          spec: { image: latestChartVersion }
        }
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1));

    expect((wrapper.vm as any).defaultImage).toBe(true);
  });
});
