import { shallowMount } from '@vue/test-utils';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

import Masthead from '@kubewarden/components/Dashboard/Masthead.vue';
import DefaultsBanner from '@kubewarden/components/DefaultsBanner';

import controllerCharts from '~/tests/unit/mocks/controllerChart';

describe('component: Masthead', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        'kubewarden/hideBannerDefaults': false,
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 jest.fn(),
        'catalog/charts':                [controllerCharts],
        'cluster/all':                   jest.fn(),
        'cluster/canList':               () => true,
        'prefs/get':                     jest.fn(),
      },
    },
  };

  const createWrapper = (overrides?: any) => {
    return shallowMount(Masthead, {
      global: {
        mocks: commonMocks,
        stubs: {
          DefaultsBanner,
          Card:             { template: '<span />' },
          ConsumptionGauge: { template: '<span />' },
        }
      },
      ...overrides,
    });
  };

  it('renders defaults banner when default app is not found', () => {
    const wrapper = createWrapper();

    const banner = wrapper.findComponent(DefaultsBanner);

    expect(banner.exists()).toBe(true);
  });

  it('renders the Upgradable button when an upgrade is available', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '2.0.4',
            appVersion: 'v1.9.0'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.9.0-%kubewarden.dashboard.upgrade.controllerChart%: 2.0.5'
    );
  });

  it('calculates the correct chart for a supported MAJOR version upgrade', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '0.4.6',
            appVersion: 'v0.5.5'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.0.0-%kubewarden.dashboard.upgrade.controllerChart%: 1.0.0'
    );
  });

  it('calculates the correct chart for a supported MINOR version upgrade', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '1.1.1',
            appVersion: 'v1.1.0'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.1.1-%kubewarden.dashboard.upgrade.controllerChart%: 1.2.3'
    );
  });

  it('calculates the correct chart for a supported PATCH version upgrade', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '2.0.0',
            appVersion: 'v1.8.0'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.9.0-%kubewarden.dashboard.upgrade.controllerChart%: 2.0.5'
    );
    expect(wrapper.vm.controllerUpgradeAvailable).toBe(controllerCharts.versions[1]);
  });

  it('calculates the correct chart for multiple appVersions with chart PATCH available', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '1.6.0',
            appVersion: 'v1.7.0'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.8.0-%kubewarden.dashboard.upgrade.controllerChart%: 2.0.2'
    );
  });

  it('calculates the correct chart for inconsistent appVersion semantics', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '1.4.0',
            appVersion: '1.5.0'
          }
        }
      }
    };

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.6.0-%kubewarden.dashboard.upgrade.controllerChart%: 1.5.3'
    );
  });

  it('calculates the correct chart for pre-release versions', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '2.0.5',
            appVersion: 'v1.9.0'
          }
        }
      }
    };

    commonMocks.$store.getters['prefs/get'].mockImplementation((key) => {
      if (key === SHOW_PRE_RELEASE) {
        return true;
      }

      return undefined;
    });

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(true);
    expect(upgradeButton.text()).toContain(
      '%kubewarden.dashboard.upgrade.appUpgrade%: v1.10.0-rc1-%kubewarden.dashboard.upgrade.controllerChart%: 2.0.6-rc1'
    );
  });

  it('does not show pre-release upgrades when preference is false', () => {
    const oldControllerApp = {
      spec: {
        chart: {
          metadata: {
            version:    '2.0.5',
            appVersion: 'v1.9.0'
          }
        }
      }
    };

    commonMocks.$store.getters['prefs/get'].mockImplementation((key) => {
      if (key === SHOW_PRE_RELEASE) {
        return false;
      }

      return undefined;
    });

    const wrapper = createWrapper({ props: { controllerApp: oldControllerApp } });

    const upgradeButton = wrapper.find('[data-testid="kw-app-controller-upgrade-button"]');

    expect(upgradeButton.exists()).toBe(false);
  });
});
