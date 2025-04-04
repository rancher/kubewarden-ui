import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import DefaultsBanner from '@kubewarden/components/DefaultsBanner.vue';
import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';
import { KUBEWARDEN_CHARTS } from '@kubewarden/constants';

import { getLatestVersion } from '@kubewarden/plugins/kubewarden-class';
import { refreshCharts, findCompatibleDefaultsChart } from '@kubewarden/utils/chart';
import { fetchControllerApp } from '@kubewarden/modules/kubewardenController';
import { handleGrowl } from '@kubewarden/utils/handle-growl';

jest.mock('lodash/debounce', () => (fn: any) => fn);
jest.mock('@kubewarden/utils/chart', () => ({
  refreshCharts:               jest.fn(),
  findCompatibleDefaultsChart: jest.fn(() => ({ version: 'compatible-version' }))
}));
jest.mock('@kubewarden/modules/kubewardenController', () => ({ fetchControllerApp: jest.fn().mockResolvedValue({ fetched: true }) }));
jest.mock('@kubewarden/utils/handle-growl', () => ({ handleGrowl: jest.fn() }));
jest.mock('@kubewarden/plugins/kubewarden-class', () => ({ getLatestVersion: jest.fn(() => 'latest-version') }));

describe('DefaultsBanner.vue', () => {
  let store: any;
  let router: any;
  let fetchTypeMock: jest.Mock;
  let $fetchState: any;
  const tFn = jest.fn((key: string) => key);

  beforeEach(() => {
    store = {
      getters: {
        'cluster/canList':          jest.fn(() => ({ a: true })), // permissions object
        'catalog/charts':           [],
        'i18n/t':                   tFn,
        'kubewarden/controllerApp': null,
        'catalog/chart':            jest.fn(() => null),
        currentCluster:             { id: 'test-cluster' }
      },
      dispatch: jest.fn()
    };
    router = { push: jest.fn() };
    $fetchState = { pending: false };
    fetchTypeMock = jest.fn().mockResolvedValue({});

    // Clear mocks on external modules
    (refreshCharts as jest.Mock).mockClear();
    (fetchControllerApp as jest.Mock).mockClear();
    (handleGrowl as jest.Mock).mockClear();
    (getLatestVersion as jest.Mock).mockClear();
    (findCompatibleDefaultsChart as jest.Mock).mockClear();
  });

  const factory = (propsData = {}) => {
    return mount(DefaultsBanner, {
      props:  propsData,
      global: {
        mocks: {
          $store:      store,
          $router:     router,
          $fetchState,
          $fetchType:  fetchTypeMock
        }
      }
    });
  };

  describe('fetch method', () => {
    it('calls debouncedRefreshCharts and fetchControllerApp when hasPermission is true and defaultsChart and controllerApp are falsy', async() => {
      // Set permissions and ensure defaultsChart and controllerApp are falsy.
      store.getters['cluster/canList'] = jest.fn(() => ({ a: true }));
      store.getters['catalog/charts'] = []; // so kubewardenRepo is undefined → defaultsChart is null.
      store.getters['kubewarden/controllerApp'] = null;
      const wrapper = factory({ mode: 'install' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      // Expect refreshCharts to have been called with init true.
      expect(refreshCharts).toHaveBeenCalledWith({
        store,
        chartName: KUBEWARDEN_CHARTS.CONTROLLER,
        init:      true
      });
      // And fetchControllerApp should be called.
      expect(fetchControllerApp).toHaveBeenCalledWith(store);
    });
  });

  describe('computed properties', () => {
    it('controllerAppVersion returns the appVersion from controllerApp', () => {
      store.getters['kubewarden/controllerApp'] = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } };
      const wrapper = factory({ mode: 'install' });

      expect(wrapper.vm.controllerAppVersion).toBe('1.0.0');
    });

    it('defaultsChart returns chart from store when kubewardenRepo exists', () => {
      const fakeChart = {
        repoName:  'repo1',
        repoType:  'type1',
        chartName: KUBEWARDEN_CHARTS.DEFAULTS,
        versions:  []
      };

      store.getters['catalog/charts'] = [fakeChart];
      store.getters['catalog/chart'] = jest.fn(() => fakeChart);
      const wrapper = factory({ mode: 'install' });

      expect(wrapper.vm.defaultsChart).toEqual(fakeChart);
    });

    it('hasPermission returns true when all permissions are true', async() => {
      store.getters['cluster/canList'] = jest.fn(() => ({
        a: true,
        b: true
      }));
      const wrapper = factory({ mode: 'install' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      expect(wrapper.vm.hasPermission).toBe(true);
    });

    it('highestCompatibleDefaultsChart returns value from findCompatibleDefaultsChart when conditions are met', () => {
      store.getters['kubewarden/controllerApp'] = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } };
      const fakeDefaultsChart = { versions: [] };

      store.getters['catalog/chart'] = jest.fn(() => fakeDefaultsChart);
      store.getters['catalog/charts'] = [{ chartName: KUBEWARDEN_CHARTS.DEFAULTS }];
      const wrapper = factory({ mode: 'install' });

      expect(wrapper.vm.highestCompatibleDefaultsChart).toEqual({ version: 'compatible-version' });
    });

    it('kubewardenRepo returns chart from charts matching DEFAULTS', () => {
      const fakeChart = { chartName: KUBEWARDEN_CHARTS.DEFAULTS };

      store.getters['catalog/charts'] = [fakeChart];
      const wrapper = factory({ mode: 'install' });

      expect(wrapper.vm.kubewardenRepo).toEqual(fakeChart);
    });

    it('bannerCopy returns the correct translation key based on mode', () => {
      const wrapperUpgrade = factory({ mode: 'upgrade' });

      expect(wrapperUpgrade.vm.bannerCopy).toBe('kubewarden.clusterAdmissionPolicy.kwDefaultsSettingsCompatibility');
      const wrapperInstall = factory({ mode: 'install' });

      expect(wrapperInstall.vm.bannerCopy).toBe('kubewarden.policyServer.noDefaultsInstalled.description');
    });

    it('btnText returns the correct translation key based on mode', () => {
      const wrapperUpgrade = factory({ mode: 'upgrade' });

      expect(wrapperUpgrade.vm.btnText).toBe('kubewarden.clusterAdmissionPolicy.defaultsUpdateBtn');
      const wrapperInstall = factory({ mode: 'install' });

      expect(wrapperInstall.vm.btnText).toBe('kubewarden.policyServer.noDefaultsInstalled.button');
    });

    it('isClosable returns false due to the logic', () => {
      const wrapper = factory({ mode: 'upgrade' });

      expect(wrapper.vm.isClosable).toBe(false);
      const wrapper2 = factory({ mode: 'install' });

      expect(wrapper2.vm.isClosable).toBe(false);
    });

    it('colorMode returns "warning" for upgrade mode and "info" for install mode', () => {
      const wrapperUpgrade = factory({ mode: 'upgrade' });

      expect(wrapperUpgrade.vm.colorMode).toBe('warning');
      const wrapperInstall = factory({ mode: 'install' });

      expect(wrapperInstall.vm.colorMode).toBe('info');
    });
  });

  describe('methods', () => {
    it('closeDefaultsBanner retries on error and calls store.dispatch twice', async() => {
      store.dispatch.mockReset();
      store.dispatch.mockResolvedValueOnce({
        type:   'error',
        status: 500
      });
      store.dispatch.mockResolvedValueOnce({ type: 'success' });
      const wrapper = factory({ mode: 'install' });

      await wrapper.vm.closeDefaultsBanner();
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      expect(store.dispatch).toHaveBeenCalledWith('kubewarden/updateHideBannerDefaults', true);
    });

    it('refreshCharts dispatches catalog/refresh and calls $fetchType and debouncedRefreshCharts when defaultsChart is falsy', async() => {
      store.dispatch.mockResolvedValue();
      store.getters['catalog/chart'] = jest.fn(() => null);
      const wrapper = factory({ mode: 'install' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      await wrapper.vm.refreshCharts(0);
      expect(store.dispatch).toHaveBeenCalledWith('catalog/refresh');
      expect(fetchTypeMock).toHaveBeenCalledWith(CATALOG.CLUSTER_REPO);
      expect(refreshCharts).toHaveBeenCalled();
    });

    it('chartRoute pushes a route when latestVersion exists', async() => {
      const fakeDefaultsChart = {
        repoType:  'type1',
        repoName:  'repo1',
        chartName: 'chart1',
        versions:  []
      };

      store.getters['catalog/chart'] = jest.fn(() => fakeDefaultsChart);
      store.getters['catalog/charts'] = [{ chartName: KUBEWARDEN_CHARTS.DEFAULTS }];
      store.getters['kubewarden/controllerApp'] = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } };
      const wrapper = factory({ mode: 'install' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      await wrapper.vm.chartRoute();
      expect(router.push).toHaveBeenCalledWith({
        name:   'c-cluster-apps-charts-install',
        params: { cluster: store.getters.currentCluster?.id || '_' },
        query:  {
          [REPO_TYPE]: fakeDefaultsChart.repoType,
          [REPO]:      fakeDefaultsChart.repoName,
          [CHART]:     fakeDefaultsChart.chartName,
          [VERSION]:   'compatible-version'
        }
      });
    });

    it('chartRoute calls handleGrowl when latestVersion is falsy', async() => {
      (getLatestVersion as jest.Mock).mockReturnValueOnce(null);
      const fakeDefaultsChart = {
        repoType:  'type1',
        repoName:  'repo1',
        chartName: 'chart1',
        versions:  []
      };

      store.getters['catalog/chart'] = jest.fn(() => fakeDefaultsChart);
      store.getters['catalog/charts'] = [{ chartName: KUBEWARDEN_CHARTS.DEFAULTS }];
      store.getters['kubewarden/controllerApp'] = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } };
      const wrapper = factory({ mode: 'install' });

      await wrapper.vm.chartRoute();
      expect(handleGrowl).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('renders Banner component with data-testid "kw-defaults-banner" when $fetchState.pending is false and hasPermission is true', async() => {
      store.getters['cluster/canList'] = jest.fn(() => ({ a: true }));
      const wrapper = factory({ mode: 'install' });


      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      await wrapper.vm.$nextTick();
      const banner = wrapper.find('[data-testid="kw-defaults-banner"]');

      expect(banner.exists()).toBe(true);
    });

    it('renders a button with data-testid "kw-defaults-banner-button" when highestCompatibleDefaultsChart exists', async() => {
      store.getters['kubewarden/controllerApp'] = { spec: { chart: { metadata: { appVersion: '1.0.0' } } } };
      const fakeDefaultsChart = {
        repoType:  'type1',
        repoName:  'repo1',
        chartName: 'chart1',
        versions:  []
      };

      store.getters['catalog/chart'] = jest.fn(() => fakeDefaultsChart);
      store.getters['catalog/charts'] = [{ chartName: KUBEWARDEN_CHARTS.DEFAULTS }];
      const wrapper = factory({ mode: 'install' });

      await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
      await flushPromises();

      await wrapper.vm.$nextTick();
      const button = wrapper.find('[data-testid="kw-defaults-banner-button"]');

      expect(button.exists()).toBe(true);
    });
  });
});
