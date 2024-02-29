import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import DashboardView from '@kubewarden/components/Dashboard/DashboardView.vue';
import DefaultsBanner from '@kubewarden/components/DefaultsBanner';
import ConsumptionGauge from '@shell/components/ConsumptionGauge';

import DEFAULTS_APP from '@tests/unit/_templates_/defaultsApp';

describe('component: DashboardView', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        'kubewarden/hideBannerDefaults': jest.fn(),
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 jest.fn(),
        'catalog/charts':                jest.fn(),
        'cluster/all':                   jest.fn(),
        'cluster/canList':               () => true,
        'prefs/get':                     jest.fn()
      },
    }
  };

  const commonComputed = {
    controllerApp:      () => null,
    controllerChart:    () => null,
    defaultsApp:        () => DEFAULTS_APP,
    hideBannerDefaults: () => false,
    globalPolicies:     () => [],
    namespacedPolicies: () => [],
    version:            () => '1.25',
    upgradeAvailable:   () => null
  };

  const createWrapper = (overrides) => {
    return shallowMount(DashboardView, {
      mocks:    commonMocks,
      computed: commonComputed,
      ...overrides
    });
  };

  const controllerCharts = {
    versions: [
      { appVersion: 'v1.10.0-rc1', version: '2.0.6-rc1' },
      { appVersion: 'v1.9.0', version: '2.0.5' },
      { appVersion: 'v1.9.0', version: '2.0.4' },
      { appVersion: 'v1.9.0', version: '2.0.3' },
      { appVersion: 'v1.9.0-rc3', version: '2.0.3-rc3' },
      { appVersion: 'v1.9.0-rc2', version: '2.0.3-rc2' },
      { appVersion: 'v1.9.0-rc1', version: '2.0.3-rc1' },
      { appVersion: 'v1.9.0', version: '2.0.3' },
      { appVersion: 'v1.8.0', version: '2.0.2' },
      { appVersion: 'v1.8.0', version: '2.0.1' },
      { appVersion: 'v1.8.0', version: '2.0.0' },
      { appVersion: 'v1.8.0-rc2', version: '2.0.0-rc1' },
      { appVersion: 'v1.8.0-rc2', version: '2.0.0-rc1' },
      { appVersion: 'v1.7.0', version: '1.6.2' },
      { appVersion: 'v1.7.0', version: '1.6.1' },
      { appVersion: 'v1.7.0', version: '1.6.0' },
      { appVersion: 'v1.7.0-rc3', version: '1.6.0-rc4' },
      { appVersion: 'v1.7.0-rc3', version: '1.6.0-rc3' },
      { appVersion: 'v1.7.0-rc2', version: '1.6.0-rc2' },
      { appVersion: 'v1.7.0-rc1', version: '1.6.0-rc1' },
      { appVersion: 'v1.6.0', version: '1.5.3' },
      { appVersion: 'v1.6.0', version: '1.5.2' },
      { appVersion: 'v1.6.0', version: '1.5.1' },
      { appVersion: 'v1.6.0', version: '1.5.0' },
      { appVersion: 'v1.6.0-rc6', version: '1.5.0-rc6' },
      { appVersion: 'v1.6.0-rc5', version: '1.5.0-rc5' },
      { appVersion: '1.5.0', version: '1.4.1' },
      { appVersion: '1.5.0', version: '1.4.0' },
      { appVersion: 'v1.4.0', version: '1.3.1' },
      { appVersion: 'v1.4.0', version: '1.3.0' },
      { appVersion: 'v1.4.0', version: '1.2.8' },
      { appVersion: 'v1.4.0-rc2', version: '1.2.8-rc2' },
      { appVersion: 'v1.4.0-rc1', version: '1.2.8-rc1' },
      { appVersion: 'v1.3.0', version: '1.2.7' },
      { appVersion: 'v1.3.0', version: '1.2.6' },
      { appVersion: 'v1.3.0', version: '1.2.4' },
      { appVersion: 'v1.1.1', version: '1.2.3' },
      { appVersion: 'v1.1.1', version: '1.2.2' },
      { appVersion: 'v1.1.1', version: '1.2.1' },
      { appVersion: 'v1.1.0', version: '1.2.0' },
      { appVersion: 'v1.1.0', version: '1.1.1' },
      { appVersion: 'v1.0.0', version: '1.0.0' },
      { appVersion: 'v1.0.0-rc4', version: '1.0.0-rc4' },
      { appVersion: 'v1.0.0-rc3', version: '1.0.0-rc3' },
      { appVersion: 'v1.0.0-rc2', version: '1.0.0-rc2' },
      { appVersion: 'v1.0.0-rc1', version: '1.0.0-rc1' },
      { appVersion: 'v0.5.5', version: '0.4.6' },
      { appVersion: 'v0.5.4', version: '0.4.5' }
    ]
  };

  it('renders defaults banner when default app is not found', () => {
    const wrapper = createWrapper({
      stubs: {
        Card:             { template: '<span />' },
        ConsumptionGauge: { template: '<span />' }
      }
    });

    const banner = wrapper.findComponent(DefaultsBanner);

    expect(banner.exists()).toBe(true);
  });

  it('renders correct gauge info of policy servers', () => {
    const pods = [
      {
        metadata: {
          state: {
            name:          'running',
            error:         false,
            transitioning: false
          }
        }
      },
      {
        metadata: {
          state: {
            name:          'pending',
            error:         false,
            transitioning: true
          }
        }
      }
    ];

    const wrapper = createWrapper({
      computed: { policyServerPods: () => pods },
      stubs:    { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(0).props().capacity).toStrictEqual(pods.length as Number);
    expect(gauges.at(0).props().used).toStrictEqual(1 as Number);
  });

  it('renders correct gauge info of admission policies', () => {
    const policies = [
      {
        status: {
          policyStatus: 'active',
          error:        false,
        },
        spec: { mode: 'protect' }
      },
      {
        status: {
          policyStatus: 'pending',
          error:        false,
        },
        spec: { mode: 'protect' }
      },
      {
        status: {
          policyStatus: 'unschedulable',
          error:        true,
        },
        spec: { mode: 'monitor' }
      }
    ];

    const wrapper = createWrapper({
      computed: { namespacedPolicies: () => policies },
      stubs:    { DefaultsBanner: { template: '<span />' } }
    });

    const gauges = wrapper.findAllComponents(ConsumptionGauge);

    expect(gauges.at(1).props().capacity).toStrictEqual(policies.length as Number);
    expect(gauges.at(1).props().used).toStrictEqual(1 as Number);
  });

  it('renders the Upgradable button when an upgrade is available', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '2.0.4', appVersion: 'v1.9.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => 'v1.9.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 2.0.5');
  });

  it('calculates the correct chart for a supported MAJOR version upgrade', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '0.4.6', appVersion: 'v0.5.5' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => 'v0.5.5',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 1.0.0');
  });

  it('calculates the correct chart for a supported MINOR version upgrade', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '1.1.1', appVersion: 'v1.1.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => 'v1.1.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 1.2.3');
  });

  it('calculates the correct chart for a supported PATCH version upgrade', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '2.0.0', appVersion: 'v1.8.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => 'v1.8.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 2.0.5');
    expect(wrapper.vm.upgradeAvailable).toBe(controllerCharts.versions[1]);
  });

  it('calculates the correct chart for multiple appVersions with chart PATCH available', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '1.6.0', appVersion: 'v1.7.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => 'v1.7.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 2.0.2');
  });

  it('calculates the correct chart for inconsistent appVersion semantics', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '1.4.0', appVersion: '1.5.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:    () => oldControllerApp,
        controllerChart:  () => controllerCharts,
        version:          () => '1.5.0',
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 1.5.3');
  });

  it('calculates the correct chart for pre-release versions', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '2.0.5', appVersion: 'v1.9.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:   () => oldControllerApp,
        controllerChart: () => controllerCharts,
        version:         () => 'v1.9.0',
        showPreRelease:  () => true
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain('%kubewarden.dashboard.upgrade.chart%: 2.0.6-rc1');
  });

  it('does not show pre-release upgrades when preference is false', () => {
    const oldControllerApp = { spec: { chart: { metadata: { version: '2.0.5', appVersion: 'v1.9.0' } } } };

    const wrapper = createWrapper({
      computed: {
        controllerApp:   () => oldControllerApp,
        controllerChart: () => controllerCharts,
        version:         () => 'v1.9.0',
        showPreRelease:  () => false
      }
    });

    const upgradeButton = wrapper.find('[data-testid="kw-app-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(false);
  });
});
