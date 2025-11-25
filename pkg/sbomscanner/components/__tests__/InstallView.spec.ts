import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Vuex from 'vuex';
import InstallView from '../InstallView.vue'; // update path
import { handleGrowl } from '../../utils/handle-growl';
import { jest } from '@jest/globals';
import { refreshCharts } from '../../utils/chart';
import { SBOMSCANNER, CNPG } from '../../types';
import { CATALOG } from '@shell/config/types';
import { nextTick } from 'vue';

jest.mock('lodash/debounce', () => jest.fn((fn) => fn));
jest.mock('@sbomscanner/utils/handle-growl', () => ({ handleGrowl: jest.fn() }));
jest.mock('@sbomscanner/utils/chart', () => ({
  refreshCharts:    jest.fn(),
  getLatestVersion: jest.fn(() => '1.0.0')
}));
let modules: Vuex.Modules<any, any> = {
  'resource-fetch': {
    namespaced: true,
    getters:    { refreshFlag: () => false },
  },
  catalog: {
    namespaced: true,
    getters:    {
      charts: () => [],
      repos:  () => []
    },
  },
};

let getters = {
  currentStore: () => (id: string) => {
    return { id, name: 'mocked-store' };
  },
  'management/byId': () => (id: string) => {
    return { id, name: 'mocked-management' };
  },
  currentCluster:      () => ({ id: 'cluster-1' }),
  // 'catalog/charts':    () => [],
  // 'catalog/repos':     () => [],
  'i18n/t':            () => jest.fn((key) => key),
  'cluster/schemaFor': () => false,
  'cluster/canList':   () => true,
  'catalog/chart':     () => ({
    repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
  }),
};

describe('InstallView.vue', () => {
  let dispatch: any;
  let wrapper: any;
  let router: any;
  let goToStepMock: any;
  let store: any;

  beforeEach(() => {
    goToStepMock = jest.fn();
    getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      currentCluster:      () => ({ id: 'cluster-1' }),
      // 'catalog/charts':    () => [],
      // 'catalog/repos':     () => [],
      'i18n/t':            () => jest.fn((key) => key),
      'cluster/schemaFor': () => false,
      'cluster/canList':   () => true,
      'catalog/chart':     () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      }),
    };

    dispatch = jest.fn(() => ({ save: jest.fn() }));

    store = createStore({
      getters,
      modules
    });
    store.dispatch = dispatch;


    router = {
      push: jest.fn(),
      go:   jest.fn()
    };

    wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $fetchState: { pending: false },
          $router:     router,
          $route:      { params: {}, query: {} },
          $fetchType:  jest.fn().mockResolvedValue(undefined),
          $store:      store,
        },
        stubs: ['InstallWizard', 'AsyncButton', 'Loading', 'Banner']
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls refreshCharts twice in fetch()', async() => {
    wrapper.vm.load = jest.fn(() => Promise.resolve());
    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await wrapper.vm.debouncedRefreshCharts();

    expect(refreshCharts).toHaveBeenCalledTimes(2);
    expect(wrapper.vm.load).toHaveBeenCalled();
  });

  it('goes to correct step when both repos are added', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });

    wrapper.vm.maxStepNum = 1;
    await wrapper.vm.onCombinedWatchedChange(
      [{ id: 'cnpg' }, { id: 'sbom' }],
      [null, null]
    );

    // wait for watcher to run
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.maxStepNum).toBe(3);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(3, true);
  });

  it('goes to step 2 if only cnpgRepo added', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });

    wrapper.vm.maxStepNum = 1;

    await wrapper.vm.onCombinedWatchedChange(
      [{ id: 'cnpg' }],
      [null, null]
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.maxStepNum).toBe(2);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(2, true);
  });

  it('goes to step 1 if only sbomscannerRepo added', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });

    wrapper.vm.maxStepNum = 2; // test that maxStepNum increases
    await wrapper.vm.onCombinedWatchedChange(
      [{ id: 'sbom' }],
      [null, null]
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.maxStepNum).toBe(2); // maxStepNum does not decrease
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(2, true);
  });

  it('Stay on if no repositories added', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });

    wrapper.vm.maxStepNum = 1; // test that maxStepNum increases
    await wrapper.vm.onCombinedWatchedChange(
      [null, null],
      []
    );

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.maxStepNum).toBe(1); // maxStepNum does not decrease
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(1, true);
  });

  it('does nothing if values did not change', async() => {
    wrapper.vm.maxStepNum = 1;

    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => ({ id: 'cnpg' }) });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => ({ id: 'sbom' }) });

    await wrapper.vm.$nextTick();

    // changing to same values
    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => ({ id: 'cnpg' }) });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => ({ id: 'sbom' }) });

    await wrapper.vm.$nextTick();

    expect(goToStepMock).toHaveBeenCalledTimes(0);
  });

  it('returns chart object when sbomscannerRepo exists', async() => {
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      'catalog/chart':   () => jest.fn().mockReturnValue({ chartName: 'sbomscanner-controller' }),
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => ({ id: 'repo-123' }) });
    const result = wrapper.vm.controllerChart4Sbomscanner;

    await nextTick();
    expect(wrapper.vm.$store.getters['catalog/chart']).toHaveBeenCalledWith({
      repoName:  'repo-123',
      repoType:  'cluster',
      chartName: SBOMSCANNER.CONTROLLER
    });
    expect(result).toEqual({ chartName: 'sbomscanner-controller' });
  });

  it('returns null when sbomscannerRepo is null', async() => {
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      'catalog/chart':   () => jest.fn().mockReturnValue({ chartName: 'sbomscanner-controller' }),
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => null });
    const result = wrapper.vm.controllerChart4Sbomscanner;

    await nextTick();

    expect(wrapper.vm.controllerChart4Sbomscanner).toBeNull();
    expect(wrapper.vm.$store.getters['catalog/chart']).not.toHaveBeenCalled();
  });

  it('returns chart object when cnpgRepo exists', async() => {
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      'catalog/chart':   () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => ({ id: 'repo-123' }) });
    const result = wrapper.vm.controllerChart4Cnpg;

    await nextTick();
    expect(wrapper.vm.$store.getters['catalog/chart']).toHaveBeenCalledWith({
      repoName:  'repo-123',
      repoType:  'cluster',
      chartName: CNPG.CONTROLLER
    });
    expect(result).toEqual({ chartName: 'cnpg-controller' });
  });

  it('returns null when cnpgRepo is null', async() => {
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      'catalog/chart':   () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => null });
    const result = wrapper.vm.controllerChart4Cnpg;

    await nextTick();

    expect(wrapper.vm.controllerChart4Cnpg).toBeNull();
    expect(wrapper.vm.$store.getters['catalog/chart']).not.toHaveBeenCalled();
  });

  it('renders loading state initially', async() => {
    wrapper.setData({ install: false });
    wrapper.vm.$fetchState.pending = true;
    await wrapper.vm.$forceUpdate();
    expect(wrapper.findComponent({ name: 'Loading' }).exists()).toBe(true);
  });

  it('sets install to true when initial install button clicked', async() => {
    wrapper.setData({ install: false });
    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => null });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => null });
    await wrapper.vm.$forceUpdate();
    const button = wrapper.find('[data-testid="sb-initial-install-button"]');

    await button.trigger('click');
    expect(wrapper.vm.install).toBe(true);
  });

  it('calls addRepository4Cnpg and sets step ready', async() => {
    await Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => false });
    await wrapper.vm.addRepository4Cnpg();
    expect(dispatch).toHaveBeenCalledWith('cluster/create',  expect.objectContaining({
      type:     expect.any(String),
      metadata: expect.any(Object),
      spec:     expect.any(Object)
    }));
  });

  it('calls addRepository4Sbomscanner and sets step ready', async() => {
    await Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => false });
    await wrapper.vm.addRepository4Sbomscanner();
    expect(dispatch).toHaveBeenCalledWith('cluster/create',  expect.objectContaining({
      type:     expect.any(String),
      metadata: expect.any(Object),
      spec:     expect.any(Object)
    }));
  });

  it('skip sets isSkipped true and goes to step 1', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });
    wrapper.vm.install = false;
    await Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => false });
    await Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => false });
    await wrapper.vm.$nextTick();

    wrapper.vm.skip();
    expect(wrapper.vm.isSkipped).toBe(true);
    expect(goToStep).toHaveBeenCalledWith(1);
  });

  it('previous sets isSkipped false and goes to step 1', async() => {
    const goToStep = jest.fn();

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });
    wrapper.vm.install = false;
    await Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => false });
    await Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => false });
    await wrapper.vm.$nextTick();
    wrapper.vm.previous();
    expect(wrapper.vm.isSkipped).toBe(false);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(1);
  });

  it('reload calls router.go', () => {
    wrapper.vm.reload();
    expect(router.go).toHaveBeenCalled();
  });

  it('chartRoute pushes router if controllerChart exists', async() => {
    const goToStep = jest.fn();
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      currentCluster:    () => ({ id: 'cluster-1' }),
      'catalog/chart':   () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
      'management/byId': () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $router:     router,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Cnpg' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep } },
      configurable: true,
    });
    await Object.defineProperty(wrapper.vm, 'hasCnpgSchema', { get: () => false });
    await Object.defineProperty(wrapper.vm, 'hasSbomscannerSchema', { get: () => false });
    wrapper.vm.isSkipped = false;
    const latestChartVersion = require('@sbomscanner/utils/chart').getLatestVersion();

    await wrapper.vm.chartRoute();

    expect(latestChartVersion).toBe('1.0.0');
    expect(router.push).toHaveBeenCalled();
  });

  it('chartRoute calls handleGrowl if no latest chart version', async() => {
    const mockSchema = { id: 'sbomscanner-schema' };
    const getters = {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      currentCluster:      () => ({ id: 'cluster-1' }),
      'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
      'catalog/chart':     () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
      'management/byId':   () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t': () => jest.fn((key) => key),
    };
    const store = createStore({ getters, modules });
    const wrapper = shallowMount(InstallView, {
      global: {
        plugins: [store],
        mocks:   {
          $store:      store,
          $router:     router,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          t:           jest.fn((key) => key),
          $t:          jest.fn((key) => key),
        },
      },
    });

    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue(null);

    await wrapper.vm.chartRoute();
    expect(handleGrowl).toHaveBeenCalled();
  });
});

describe('InstallView.vue - schema computed tests', () => {
  let mockStore: any;

  const factory = (mockStore: any) => {
    return shallowMount(InstallView, {
      global: {
        plugins: [mockStore],
        mocks:   {
          $store:      mockStore,
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          $fetchType:  (type: string) => Promise.resolve(type),
          t:           (key: string) => key,
          $t:          (key: string) => key,
        },
      },
    });
  };

  it('calls cluster/schemaFor with SBOMSCANNER.SCHEMA and returns truthy value', () => {
    const mockSchema = { id: 'sbomscanner-schema' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);
    const result = wrapper.vm.hasSbomscannerSchema;

    expect(mockStore.getters['cluster/schemaFor']).toHaveBeenCalledWith(SBOMSCANNER.SCHEMA);
    expect(result).toBe(mockSchema);
  });

  it('calls cluster/schemaFor with CNPG.SCHEMA and returns truthy value', () => {
    const mockSchema = { id: 'cnpg-schema' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });


    const wrapper = factory(mockStore);
    const result = wrapper.vm.hasCnpgSchema;

    expect(mockStore.getters['cluster/schemaFor']).toHaveBeenCalledWith(CNPG.SCHEMA);
    expect(result).toBe(mockSchema);
  });

  it('returns falsy when schemaFor returns null', () => {
    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'cluster/schemaFor': () => jest.fn().mockReturnValue(null),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);
    const result = wrapper.vm.hasSbomscannerSchema;

    expect(result).toBeNull();
  });

  it('fetches cluster repo if canList is true', async() => {
    const mockSchema = { id: 'cnpg-schema' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':     () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'cluster/canList':   () => jest.fn().mockReturnValue(true),

        'management/byId': () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);

    jest.spyOn(wrapper.vm, '$fetchType').mockResolvedValue(undefined);
    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });

    wrapper.vm.debouncedRefreshCharts = jest.fn();
    await nextTick();
    await wrapper.vm.load();
    expect(wrapper.vm.$store.getters['cluster/canList']).toHaveBeenCalledWith(CATALOG.CLUSTER_REPO);
    expect(wrapper.vm.$fetchType).toHaveBeenCalledWith(CATALOG.CLUSTER_REPO);
  });

  it('advances to CNPG step when cnpgRepo exists', async() => {
    const mockSchema = { id: 'repo-cnpg' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':     () => jest.fn().mockReturnValue({ chartName: 'cnpg-controller' }),
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'cluster/canList':   () => jest.fn().mockReturnValue(true),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    Object.defineProperty(wrapper.vm, 'cnpgRepo', { get: () => ({ id: 'repo-cnpg' }) });
    jest.spyOn(wrapper.vm, '$fetchType').mockResolvedValue(undefined);

    wrapper.vm.debouncedRefreshCharts = jest.fn();
    await nextTick();
    await wrapper.vm.load();
    await new Promise((r) => setTimeout(r, 600));
    expect(wrapper.vm.installSteps[1].ready).toBe(true);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(2, true);

  });

  it('advances to SBOMScanner step when sbomscannerRepo exists', async() => {
    const mockSchema = { id: 'repo-sbomscanner' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':     () => jest.fn(),
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'cluster/canList':   () => jest.fn().mockReturnValue(true),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => ({ id: 'repo-sbomscanner' }) });
    jest.spyOn(wrapper.vm, '$fetchType').mockResolvedValue(undefined);

    wrapper.vm.debouncedRefreshCharts = jest.fn();
    await nextTick();
    await wrapper.vm.load();
    await new Promise((r) => setTimeout(r, 600));
    expect(wrapper.vm.installSteps[2].ready).toBe(true);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(3, true);
  });

  it('calls debouncedRefreshCharts when missing sbomscannerRepo', async() => {
    const mockSchema = { id: 'repo-sbomscanner' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':     () => jest.fn(),
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'cluster/canList':   () => jest.fn().mockReturnValue(true),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => null });
    Object.defineProperty(wrapper.vm, 'controllerChart4Sbomscanner', { get: () => null });
    jest.spyOn(wrapper.vm, '$fetchType').mockResolvedValue(undefined);

    wrapper.vm.debouncedRefreshCharts = jest.fn();
    await nextTick();
    await wrapper.vm.load();
    expect(wrapper.vm.debouncedRefreshCharts).toHaveBeenCalledWith(true);
  });

  it('does not call debouncedRefreshCharts when sbomscannerRepo and controllerChart4Sbomscanner exist', async() => {
    const mockSchema = { id: 'repo-sbomscanner' };

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':     () => jest.fn(),
        'cluster/schemaFor': () => jest.fn().mockReturnValue(mockSchema),
        'cluster/canList':   () => jest.fn().mockReturnValue(true),
        'management/byId':   () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    Object.defineProperty(wrapper.vm, 'sbomscannerRepo', { get: () => ({ id: 'repo-sbomscanner' }) });
    Object.defineProperty(wrapper.vm, 'controllerChart4Sbomscanner', { get: () => ({ id: 'chart' }) });
    jest.spyOn(wrapper.vm, '$fetchType').mockResolvedValue(undefined);

    wrapper.vm.debouncedRefreshCharts = jest.fn();
    await nextTick();
    await wrapper.vm.load();
    expect(wrapper.vm.debouncedRefreshCharts).not.toHaveBeenCalled();
  });
  it('addRepository4Cnpg - handles exception by calling handleGrowl and btnCb(false)', async() => {
    // 1️⃣ Mock the repo object that throws
    const mockError = new Error('Save failed');
    const mockRepo = { save: jest.fn().mockRejectedValue(mockError) };

    // 2️⃣ Mock callback
    const mockBtnCb = jest.fn();

    const mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':   () => jest.fn(),
        'cluster/canList': () => jest.fn().mockReturnValue(true),
        'management/byId': () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    mockStore.dispatch = jest.fn().mockResolvedValue(mockRepo);
    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });


    await wrapper.vm.addRepository4Cnpg(mockBtnCb);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(handleGrowl).toHaveBeenCalledWith({
      error: mockError,
      store: wrapper.vm.$store,
    });
    expect(mockBtnCb).toHaveBeenCalledWith(false);
  });
  it('addRepository4Cnpg - handles exception by calling dispatch(\'cluster/create\')', async() => {
    // 1️⃣ Mock the repo object that throws
    const mockError = new Error('Dispatch failed');
    const mockRepo = { save: jest.fn().mockRejectedValue(mockError) };

    // 2️⃣ Mock callback
    const mockBtnCb = jest.fn();

    mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':   () => jest.fn(),
        'cluster/canList': () => jest.fn(),
        'management/byId': () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    mockStore.dispatch = jest.fn().mockRejectedValue(mockError);

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });


    await wrapper.vm.addRepository4Cnpg(mockBtnCb);

    expect(mockRepo.save).not.toHaveBeenCalled();
    expect(handleGrowl).toHaveBeenCalledWith({
      error: mockError,
      store: wrapper.vm.$store,
    });
    expect(mockBtnCb).toHaveBeenCalledWith(false);
  });
  it('addRepository4Sbomscanner- handles exception by calling handleGrowl and btnCb(false)', async() => {
    // 1️⃣ Mock the repo object that throws
    const mockError = new Error('Save failed');
    const mockRepo = { save: jest.fn().mockRejectedValue(mockError) };

    // 2️⃣ Mock callback
    const mockBtnCb = jest.fn();

    const mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':   () => jest.fn(),
        'cluster/canList': () => jest.fn().mockReturnValue(true),
        'management/byId': () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    mockStore.dispatch = jest.fn().mockResolvedValue(mockRepo);

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });

    await wrapper.vm.addRepository4Sbomscanner(mockBtnCb);

    expect(mockRepo.save).toHaveBeenCalled();
    expect(handleGrowl).toHaveBeenCalledWith({
      error: mockError,
      store: wrapper.vm.$store,
    });
    expect(mockBtnCb).toHaveBeenCalledWith(false);
  });
  it('addRepository4Sbomscanner - handles exception by calling dispatch(\'cluster/create\')', async() => {
    // 1️⃣ Mock the repo object that throws
    const mockError = new Error('Dispatch failed');

    // 2️⃣ Mock callback
    const mockBtnCb = jest.fn();

    const mockStore = createStore({
      getters: {
        currentStore: () => (id: string) => {
          return { id, name: 'mocked-store' };
        },
        'catalog/chart':   () => jest.fn(),
        'cluster/canList': () => jest.fn(),
        'management/byId': () => (id: string) => {
          return { id, name: 'mocked-management' };
        },
        'i18n/t': () => jest.fn((key) => key),
      },
      modules
    });

    mockStore.dispatch = jest.fn().mockRejectedValue(mockError);

    const wrapper = factory(mockStore);

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });

    await wrapper.vm.addRepository4Sbomscanner(mockBtnCb);

    expect(handleGrowl).toHaveBeenCalledWith({
      error: mockError,
      store: wrapper.vm.$store,
    });
    expect(mockBtnCb).toHaveBeenCalledWith(false);
  });
});

describe('chartRoute - InstallView router push', () => {
  // 1️⃣ Factory function to create the wrapper
  const storeMock =  createStore({
    getters: {
      currentStore: () => (id: string) => {
        return { id, name: 'mocked-store' };
      },
      currentCluster:      () => ({ id: 'cluster-1' }),
      'cluster/schemaFor': () => jest.fn(),
      'cluster/canList':   () => jest.fn(),
      'management/byId':   () => (id: string) => {
        return { id, name: 'mocked-management' };
      },
      'i18n/t':        () => jest.fn((key) => key),
      'catalog/chart': () => jest.fn().mockReturnValue({ chartName: 'sbomscanner-controller' }),
    },
    modules
  });
  const factory = (options: any = {}): VueWrapper<any> => {
    return shallowMount(InstallView, {
      global: {
        mocks: {
          $route:      { params: {}, query: {} },
          $fetchState: { pending: false },
          $fetchType:  (type: string) => Promise.resolve(type),
          $router:     options.routerMock || { push: jest.fn() },
          $store:      storeMock || { getters: {}, dispatch: jest.fn() },
          $t:          (k: string) => k,
          t:           (k: string) => k,
        },
      },
    });
  };

  it('hasCnpgSchema is false - calls $router.push normally', async() => {
    const routerMock = { push: jest.fn() };
    const wrapper = factory({ routerMock });

    Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });


    await Object.defineProperty(wrapper.vm, 'controllerChart4Cnpg' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasCnpgSchema', { get: () => false });
    wrapper.vm.isSkipped = false;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue('1.0.0');

    await wrapper.vm.chartRoute();

    expect(routerMock.push).toHaveBeenCalledWith({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: 'cluster-1' },
      query:  {
        'chart':     'chart1',
        'repo':      'repo1',
        'repo-type': 'cluster',
        'version':   '1.0.0',
      },
    });
  });

  it('hasCnpgSchema is false - handles exception when $router.push fails', async() => {
    const routerMock = {
      push: jest.fn().mockImplementation(() => {
        throw new Error('Router push failed');
      }),
    };

    const wrapper = factory({ routerMock });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Cnpg' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasCnpgSchema', { get: () => false });
    await Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    wrapper.vm.isSkipped = false;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue('1.0.0');
    await wrapper.vm.chartRoute();

    expect(routerMock.push).toHaveBeenCalled();
    expect(wrapper.vm.installSteps[0].ready).toBe(false);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(1);
  });

  it('hasCnpgSchema is false - handles exception when getLatestVersion returns null', async() => {
    const routerMock = {
      push: jest.fn().mockImplementation(() => {
        throw new Error('Router push failed');
      }),
    };

    const wrapper = factory({ routerMock });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Cnpg' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasCnpgSchema', { get: () => false });
    await Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    wrapper.vm.isSkipped = false;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue(null);

    await wrapper.vm.chartRoute();

    expect(routerMock.push).not.toHaveBeenCalled();
    expect(handleGrowl).toHaveBeenCalledWith({
      error: {
        _statusText: wrapper.vm.$t('imageScanner.dashboard.appInstall.versionError.title'),
        message:     wrapper.vm.$t('imageScanner.dashboard.appInstall.versionError.message')
      },
      store: wrapper.vm.$store,
    });
  });

  it('hasSbomscannerSchema is false - calls $router.push normally', async() => {
    const routerMock = { push: jest.fn() };
    const wrapper = factory({ routerMock });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Sbomscanner' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasSbomscannerSchema', { get: () => false });
    wrapper.vm.isSkipped = true;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue('1.0.0');

    await wrapper.vm.chartRoute();

    expect(routerMock.push).toHaveBeenCalledWith({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: 'cluster-1' },
      query:  {
        'chart':     'chart1',
        'repo':      'repo1',
        'repo-type': 'cluster',
        'version':   '1.0.0',
      },
    });
  });

  it('hasSbomscannerSchema is false - handles exception when $router.push fails', async() => {
    const routerMock = {
      push: jest.fn().mockImplementation(() => {
        throw new Error('Router push failed');
      }),
    };

    const wrapper = factory({ routerMock });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Sbomscanner' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasSbomscannerSchema', { get: () => false });
    await Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    wrapper.vm.isSkipped = true;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue('1.0.0');
    await wrapper.vm.chartRoute();

    expect(routerMock.push).toHaveBeenCalled();
    expect(wrapper.vm.installSteps[1].ready).toBe(false);
    expect(wrapper.vm.$refs.wizard.goToStep).toHaveBeenCalledWith(2);
  });

  it('hasSbomscannerSchema is false - handles exception when getLatestVersion returns null', async() => {
    const routerMock = {
      push: jest.fn().mockImplementation(() => {
        throw new Error('Router push failed');
      }),
    };

    const wrapper = factory({ routerMock });

    await Object.defineProperty(wrapper.vm, 'controllerChart4Sbomscanner' , {
      get: () => ({
        repoType: 'cluster', repoName: 'repo1', chartName: 'chart1', versions: ['1.0.0']
      })
    });
    await Object.defineProperty(wrapper.vm, 'hasSbomscannerSchema', { get: () => false });
    await Object.defineProperty(wrapper.vm.$, 'refs', {
      value:        { wizard: { goToStep: jest.fn() } },
      configurable: true,
    });
    wrapper.vm.isSkipped = true;
    require('@sbomscanner/utils/chart').getLatestVersion.mockReturnValue(null);

    await wrapper.vm.chartRoute();

    expect(routerMock.push).not.toHaveBeenCalled();
    expect(handleGrowl).toHaveBeenCalledWith({
      error: {
        _statusText: wrapper.vm.$t('imageScanner.dashboard.appInstall.versionError.title'),
        message:     wrapper.vm.$t('imageScanner.dashboard.appInstall.versionError.message')
      },
      store: wrapper.vm.$store,
    });
  });
});

