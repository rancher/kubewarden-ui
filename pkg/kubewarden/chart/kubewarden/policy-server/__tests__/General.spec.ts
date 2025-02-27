import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import flushPromises from 'flush-promises';

import General from '@kubewarden/chart/kubewarden/policy-server/General.vue';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';
import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver';

import { fleetBundles as bundles } from '@tests/unit/mocks/fleetBundles';
import { mockControllerAppWithFleet } from '@tests/unit/mocks/controllerApp';

interface StoreOverrides {
  apps?: any[];
  fleetBundles?: any[];
  controllerApp?: any;
  defaultsChart?: any;
}

interface WrapperOptions {
  storeOverrides?: StoreOverrides;
  props?: Record<string, any>;
  global?: {
    mocks?: Record<string, any>;
    stubs?: Record<string, any>;
  };
}

// Update the fleet module mock to match the new import path.
jest.mock('@kubewarden/modules/fleet', () => {
  const actual = jest.requireActual('@kubewarden/modules/fleet');

  return {
    getPolicyServerModule: actual.getPolicyServerModule,
    isFleetDeployment:     actual.isFleetDeployment,
    findFleetContent:      actual.findFleetContent
  };
});

// Create a fake store that mimics the getters and dispatch used in General.vue.
function createFakeStore(overrides: StoreOverrides = {}) {
  return {
    getters: {
      'cluster/canList': () => true,
      // For simplicity, we assume that if the component asks for apps it returns an empty array.
      'cluster/all':     (type) => {
        if (type === 'app') {
          return overrides.apps || [];
        }

        return [];
      },
      'i18n/t':                     () => (key) => key,
      'management/byId':            jest.fn(),
      'resource-fetch/refreshFlag': jest.fn(),
      'management/all':             (type) => {
        if (type === 'fleet.cattle.io.bundle') {
          return overrides.fleetBundles || [];
        }

        return [];
      },
      'kubewarden/controllerApp': overrides.controllerApp || null,
      'catalog/chart':            jest.fn(() => overrides.defaultsChart || null)
    },
    dispatch: jest.fn(() => Promise.resolve())
  };
}

const defaultMountOptions = {
  props: {
    value:           DEFAULT_POLICY_SERVER,
    // For the new component, serviceAccounts are passed as a prop.
    serviceAccounts: ['sa-1', 'sa-2', 'sa-3']
    // Note: not passing mode means isCreate (computed as mode === _CREATE) will be false.
  },
  global: {
    stubs: {
      // Loading:           { template: '<div data-testid="loading" />' },
      ServiceNameSelect: {
        template: '<div />',
        props:    ['modelValue', 'options']
      },
      Banner:         { template: '<span />' },
      LabeledInput:   { template: '<span />' },
      LabeledTooltip: { template: '<span />' },
      RadioGroup:     { template: '<span />' }
    }
  }
};

function createWrapper(options: WrapperOptions = {}) {
  const store = createFakeStore(options.storeOverrides || {});
  const mountOptions = {
    props: {
      ...defaultMountOptions.props,
      ...(options.props || {})
    },
    global: {
      provide: { store },
      mocks:   { ...(options.global?.mocks || {}) },
      stubs:   {
        ...defaultMountOptions.global.stubs,
        ...(options.global?.stubs || {})
      }
    }
  };

  return mount(General, mountOptions);
}

describe('component: General', () => {
  it('displays service account options', () => {
    const wrapper = createWrapper();
    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props('options')).toStrictEqual(['sa-1', 'sa-2', 'sa-3']);
  });

  it('displays correct service account when existing', async() => {
    const policyServer = {
      ...DEFAULT_POLICY_SERVER,
      spec: { serviceAccountName: 'sa-2' }
    };

    const wrapper = createWrapper({ props: { value: policyServer } });
    const selector = wrapper.findComponent(ServiceNameSelect);

    await nextTick();

    expect(selector.props('value')).toStrictEqual('sa-2');
  });

  it('extracts latestChartVersion when isFleet is true', async() => {
    const expectedVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';

    // Override the fake store to simulate a fleet deployment.
    const wrapper = createWrapper({
      storeOverrides: {
        controllerApp: mockControllerAppWithFleet,
        fleetBundles:  bundles
      }
    });

    // Wait for fetchData (called onMounted) and any subsequent promise resolution.
    await flushPromises();

    expect(wrapper.vm.latestChartVersion).toBe(expectedVersion);
  });

  it('hides main content when isLoading is true', async() => {
    const wrapper = createWrapper();

    wrapper.vm.isLoading = true;
    await nextTick();

    expect(wrapper.find('[data-testid="ps-general-loading"').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ps-config-image-inputs"]').exists()).toBe(false);
  });

  it('shows image-row when isLoading is false', async() => {
    const wrapper = createWrapper();

    wrapper.vm.isLoading = false;
    await nextTick();

    expect(wrapper.find('[data-testid="ps-config-image-inputs"]').exists()).toBe(true);
  });

  it('sets defaultImage to true when not isCreate and image matches latestChartVersion', async() => {
    const expectedVersion = 'ghcr.io/kubewarden/policy-server:v1.15.0';
    const policyServer = {
      ...DEFAULT_POLICY_SERVER,
      spec: { image: expectedVersion }
    };

    const wrapper = createWrapper({ props: { value: policyServer } });

    // Simulate that fetchData (onMounted) has set latestChartVersion to the expected value.
    wrapper.vm.latestChartVersion = expectedVersion;
    await nextTick();

    expect(wrapper.vm.defaultImage).toBe(true);
  });
});
