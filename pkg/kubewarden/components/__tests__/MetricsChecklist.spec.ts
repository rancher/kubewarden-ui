import { shallowMount } from '@vue/test-utils';

import MetricsChecklist from '@kubewarden/components/MetricsChecklist.vue';

const commons = {
  props: {},
  mocks: {
    $store: {
      getters: {
        currentCluster: () => ({ id: 'test-cluster' }),
        'i18n/t':       () => jest.fn(),
      },
    },
    $router: jest.fn(),
    $route:  jest.fn(),
  },
  global: {
    stubs: {
      'router-link': { template: '<span />' },
      Banner:        { template: '<span />' },
    },
  },
};

const createWrapper = (options = {}) => {
  return shallowMount(MetricsChecklist, {
    ...commons,
    ...options,
  });
};

describe('MetricsChecklist.vue', () => {
  it('shows the conflicting dashboards banner when there are conflicting dashboards and no Kubewarden dashboards', () => {
    const conflictingGrafanaDashboards = [{ metadata: { name: 'Dashboard1' } }];

    const wrapper = createWrapper({ props: { conflictingGrafanaDashboards } });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(true);
  });

  it('does not show the conflicting dashboards banner when there are no conflicting dashboards', () => {
    const wrapper = createWrapper({ props: { conflictingGrafanaDashboards: [] } });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(false);
  });

  it('does not show the conflicting dashboards banner when there are Kubewarden dashboards, even if there are conflicting dashboards', () => {
    const conflictingGrafanaDashboards = [{ metadata: { name: 'Dashboard1' } }];

    const wrapper = createWrapper({
      props: {
        kubewardenDashboards: [{ metadata: { name: 'Dashboard1' } }],
        conflictingGrafanaDashboards,
      },
    });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(false);
  });

  it('disables the dashboard button when there is no monitoring app', () => {
    const wrapper = createWrapper({
      props: {
        monitoringApp:                null,
        cattleDashboardNs:            {},
        conflictingGrafanaDashboards: [],
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('disables the dashboard button when cattleDashboardNs is empty', () => {
    const wrapper = createWrapper({
      props: {
        monitoringApp:                {},
        cattleDashboardNs:            {},
        conflictingGrafanaDashboards: [],
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('disables the dashboard button when there are conflicting Grafana dashboards and no Kubewarden dashboards', () => {
    const wrapper = createWrapper({
      props: {
        monitoringApp:                {},
        cattleDashboardNs:            {},
        conflictingGrafanaDashboards: [{ metadata: { name: 'Dashboard1' } }],
      }
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('enables the dashboard button when monitoring app is present, cattleDashboardNs is not empty, and there are no conflicting Grafana dashboards', () => {
    const wrapper = createWrapper({
      props: {
        monitoringApp:                {},
        cattleDashboardNs:            { someKey: 'someValue' },
        conflictingGrafanaDashboards: [],
      }
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(false);
  });

  it('enables the dashboard button when there is a monitoring app, the cattleDashboardNs is not empty, Kubewarden dashboards exist, and there are conflicting dashboards', () => {
    const wrapper = createWrapper({
      props: {
        monitoringApp:                {},
        cattleDashboardNs:            { someKey: 'someValue' },
        conflictingGrafanaDashboards: [{ metadata: { name: 'Dashboard1' } }],
        kubewardenDashboards:         [{ metadata: { name: 'Dashboard1' } }],
      }
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(false);
  });
});
