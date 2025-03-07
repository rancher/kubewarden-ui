import { shallowMount } from '@vue/test-utils';

import TraceChecklist from '@kubewarden/components/TraceChecklist.vue';

describe('TraceChecklist.vue', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      { getters: { currentCluster: () => 'current_cluster' } },
    $router:     { push: jest.fn() },
    $route:      { params: { cluster: '_' } }
  };

  const commonStubs = { Banner: false };

  const commonProps = {
    controllerApp:            null,
    controllerChart:          null,
    tracingConfiguration:     null,
    jaegerQuerySvc:           null,
    openTelSvc:               null,
    outdatedTelemetrySpec:    false,
    unsupportedTelemetrySpec: false,
    incompleteTelemetrySpec:  false
  };

  const createWrapper = (overrides: any = {}) => {
    return shallowMount(TraceChecklist, {
      global: {
        mocks: {
          ...commonMocks,
          ...overrides.mocks
        },
        stubs: {
          ...commonStubs,
          ...overrides.stubs
        },
      },
      props: {
        ...commonProps,
        ...overrides.props
      },
      ...overrides,
    });
  };

  it('computes controllerLinkTooltip when missing services', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.controllerLinkTooltip)
      .toBe('%kubewarden.monitoring.prerequisites.tooltips.prerequisites%');
  });

  it('computes controllerLinkTooltip when chart dependencies are missing', () => {
    const wrapper = createWrapper({
      props: {
        jaegerQuerySvc: {},
        openTelSvc:     {}
      }
    });

    expect(wrapper.vm.controllerLinkTooltip)
      .toBe('%kubewarden.monitoring.prerequisites.tooltips.chartError%');
  });

  it('computes controllerLinkTooltip as null when all dependencies are provided', () => {
    const wrapper = createWrapper({
      props: {
        controllerApp:   { spec: { chart: { metadata: {} } } },
        controllerChart: {},
        jaegerQuerySvc:  {},
        openTelSvc:      {}
      }
    });

    expect(wrapper.vm.controllerLinkTooltip).toBeNull();
  });

  it('computes controllerLinkDisabled correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.controllerLinkDisabled).toBe(true);

    const wrapper2 = createWrapper({
      props: {
        controllerApp:   { spec: { chart: { metadata: {} } } },
        controllerChart: {},
        jaegerQuerySvc:  {},
        openTelSvc:      {}
      }
    });

    expect(wrapper2.vm.controllerLinkDisabled).toBe(false);
  });

  it('computes tracingEnabled correctly', () => {
    const wrapper = createWrapper({ props: { tracingConfiguration: { enabled: true } } });

    expect(wrapper.vm.tracingEnabled).toBe(true);

    const wrapper2 = createWrapper({ props: { tracingConfiguration: null } });

    expect(wrapper2.vm.tracingEnabled).toBeNull();
  });

  it('returns correct classes from badgeIcon', () => {
    const wrapper = createWrapper();

    const resultTrue = wrapper.vm.badgeIcon(true);

    expect(resultTrue).toEqual({
      'icon-dot-open':  false,
      'icon-checkmark': true,
      'text-success':   true
    });

    const resultFalse = wrapper.vm.badgeIcon(false);

    expect(resultFalse).toEqual({
      'icon-dot-open':  true,
      'icon-checkmark': false,
      'text-success':   false
    });
  });

  it('does not navigate via controllerAppRoute when controllerApp is not provided', () => {
    const wrapper = createWrapper({ props: { controllerApp: null } });

    wrapper.vm.controllerAppRoute();

    const routerPushSpy = jest.spyOn(wrapper.vm.$router, 'push');

    expect(routerPushSpy).not.toHaveBeenCalled();
  });

  it('navigates correctly via controllerAppRoute when controllerApp is provided', async() => {
    const mockAnnotations = {
      'catalog.cattle.io/catalog-namespace': 'mockNamespace',
      'catalog.cattle.io/release-name':      'mockReleaseName',
      'catalog.cattle.io/upstream-version':  'mockVersion',
      'catalog.cattle.io/source-repo-name':  'mockRepoName',
      'catalog.cattle.io/source-repo-type':  'mockRepoType'
    };
    const mockMetadata = {
      annotations: mockAnnotations,
      name:        'mockChartName'
    };
    const mockControllerApp = { spec: { chart: { metadata: mockMetadata } } };

    const wrapper = createWrapper({ props: { controllerApp: mockControllerApp } });

    wrapper.vm.controllerAppRoute();

    await wrapper.vm.$nextTick();

    const routerPushSpy = jest.spyOn(wrapper.vm.$router, 'push');

    expect(routerPushSpy).toHaveBeenCalled();
    const pushArg = routerPushSpy.mock.calls[0][0];

    expect(pushArg.name).toBe('c-cluster-apps-charts-install');
    expect(pushArg.params).toEqual({ cluster: '_' });

    expect(pushArg.query).toEqual({
      'chart':     'mockChartName',
      'name':      'mockReleaseName',
      'namespace': undefined,
      'repo':      undefined,
      'repo-type': undefined,
      'version':   'mockVersion',
    });
  });

  it('conditionally renders telemetry banners based on telemetry spec props', () => {
    const wrapper = createWrapper({
      props: {
        outdatedTelemetrySpec:    true,
        unsupportedTelemetrySpec: true,
        incompleteTelemetrySpec:  true
      }
    });

    const banners = wrapper.findAllComponents({ name: 'Banner' });

    expect(banners.length).toBeGreaterThanOrEqual(4);
  });
});
