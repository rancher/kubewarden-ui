import { createWrapper } from '@tests/unit/utils/wrapper';

import MetricsChecklist from '@kubewarden/components/MetricsChecklist.vue';

const commons = {
  propsData: {},
  computed:  { hasKubewardenDashboards: () => false },
  mocks:     {
    $store: {
      getters: {
        currentCluster: () => ({ id: 'test-cluster' }),
        'i18n/t':       () => jest.fn(),
      },
    },
    $router: jest.fn(),
    $route:  jest.fn(),
  },
};

const wrapperFactory = createWrapper(MetricsChecklist, commons);

describe('MetricChecklist.vue', () => {
  it('shows the conflicting dashboards banner when there are conflicting dashboards and no Kubewarden dashboards', () => {
    const conflictingGrafanaDashboards = [{ metadata: { name: 'Dashboard1' } }];

    const wrapper = wrapperFactory({
      propsData: { conflictingGrafanaDashboards },
      computed:  { hasKubewardenDashboards: () => false },
      stubs:     {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(true);
  });

  it('does not show the conflicting dashboards banner when there are no conflicting dashboards', () => {
    const wrapper = wrapperFactory({
      propsData: { conflictingGrafanaDashboards: [] },
      computed:  { hasKubewardenDashboards: () => false },
      stubs:     {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(false);
  });

  it('does not show the conflicting dashboards banner when there are Kubewarden dashboards, even if there are conflicting dashboards', () => {
    const conflictingGrafanaDashboards = [{ metadata: { name: 'Dashboard1' } }];

    const wrapper = wrapperFactory({
      propsData: { conflictingGrafanaDashboards },
      computed:  { hasKubewardenDashboards: () => true }, // Simulate presence of KubeWarden dashboards
      stubs:     {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.showConflictingDashboardsBanner).toBe(false);
  });

  it('disables the dashboard button when there is no monitoring app', () => {
    const wrapper = wrapperFactory({
      propsData: {
        monitoringApp:                null,
        cattleDashboardNs:            {},
        conflictingGrafanaDashboards: [],
      },
      stubs: {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('disables the dashboard button when the cattleDashboardNs is empty', () => {
    const wrapper = wrapperFactory({
      propsData: {
        monitoringApp:                {},
        cattleDashboardNs:            null,
        conflictingGrafanaDashboards: [],
      },
      stubs: {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('disables the dashboard button when there are conflicting Grafana dashboards', () => {
    const wrapper = wrapperFactory({
      propsData: {
        monitoringApp:                {},
        cattleDashboardNs:            {},
        conflictingGrafanaDashboards: [{ metadata: { name: 'Dashboard1' } }],
      },
      stubs: {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(true);
  });

  it('enables the dashboard button when monitoring app is present, cattleDashboardNs is not empty, and there are no conflicting Grafana dashboards', () => {
    const wrapper = wrapperFactory({
      propsData: {
        monitoringApp:                {},
        cattleDashboardNs:            { someKey: 'someValue' },
        conflictingGrafanaDashboards: [],
      },
      stubs: {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(false);
  });

  it('enables the dashboard button when monitoring app is present, cattleDashboardNs is not empty, kubewarden dashboards exists and there are conflicting Grafana dashboards', () => {
    const conflictingGrafanaDashboards = [{ metadata: { name: 'Dashboard1' } }];

    const wrapper = wrapperFactory({
      propsData: {
        monitoringApp:     {},
        cattleDashboardNs: { someKey: 'someValue' },
        conflictingGrafanaDashboards,
      },
      computed: { hasKubewardenDashboards: () => true },
      stubs:    {
        'n-link': { template: '<span />' },
        Banner:   { template: '<span />' },
      },
    });

    expect(wrapper.vm.dashboardButtonDisabled).toBe(false);
  });
});
