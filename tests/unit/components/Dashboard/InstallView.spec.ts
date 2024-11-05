import { mount } from '@vue/test-utils';

import { SHOW_PRE_RELEASE } from '@shell/store/prefs';

import { controllerCharts } from '@tests/unit/_templates_/controllerCharts';

import InstallView from '@kubewarden/components/Dashboard/InstallView.vue';

describe('InstallView.vue', () => {
  const commonMocks = {
    $fetchState: { pending: false },
    $store:      {
      getters: {
        currentCluster:                  () => 'current_cluster',
        'kubewarden/hideBannerDefaults': jest.fn(),
        'i18n/t':                        jest.fn(),
        'catalog/chart':                 jest.fn(),
        'catalog/charts':                jest.fn(),
        'catalog/repos':                 jest.fn(),
        'cluster/all':                   jest.fn(),
        'cluster/canList':               () => true,
        'prefs/get':                     jest.fn(),
        'management/byId':               jest.fn(),
        'resource-fetch/refreshFlag':    jest.fn(),
      },
    },
    $router: { push: jest.fn() }
  };

  const commonComputed = {
    isAirgap:           () => false,
    controllerChart:    () => null,
    kubewardenRepo:     () => null,
    shellEnabled:       () => false,
    showPreRelease:     () => false
  };

  const commonStubs = {
    Loading:     { template: '<span />' },
    CopyCode:    { template: '<span />' },
    AsyncButton: { template: '<span />' },
  };

  const createWrapper = (overrides?) => {
    return mount(InstallView, {
      mocks:    commonMocks,
      computed: commonComputed,
      stubs:    commonStubs,
      ...overrides,
    });
  };

  it('renders initial install step and proceeds to the next step', async() => {
    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="kw-install-title"]').exists()).toBe(true);

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="kw-install-wizard"]').exists()).toBe(true);
  });

  it('renders kubewarden repo step when not installed', async() => {
    const wrapper = createWrapper({
      computed: {
        kubewardenRepo:   () => null,
      }
    });

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="kw-repo-title"]').exists()).toBe(true);
  });

  it('renders controller chart step when not installed', async() => {
    const wrapper = createWrapper({
      data() {
        return { initStepIndex: 1 };
      },
      computed: {
        kubewardenRepo:   () => true,
        controllerChart:  () => null,
      }
    });

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="kw-app-install-title"]').exists()).toBe(true);
  });

  it('renders reload button when controller chart is not installed and reload is ready', async() => {
    const wrapper = createWrapper({
      data() {
        return { initStepIndex: 1, reloadReady: true };
      },
      computed: {
        kubewardenRepo:   () => true,
        controllerChart:  () => false,
      }
    });

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');

    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="kw-app-install-reload"]').exists()).toBe(true);
  });

  it('chartRoute returns stable version when showPreRelease is false', async() => {
    commonMocks.$store.getters['prefs/get'].mockImplementation((key) => {
      if ( key === SHOW_PRE_RELEASE ) {
        return false;
      }

      return undefined;
    });

    const wrapper = createWrapper({
      data() {
        return { initStepIndex: 1 };
      },
      computed: {
        kubewardenRepo:   () => true,
        controllerChart:  () => controllerCharts,
        showPreRelease:   () => false
      }
    });

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');

    await wrapper.vm.$nextTick();

    // Find the button and trigger a click event
    const button = wrapper.find('[data-testid="kw-app-install-button"]');

    button.trigger('click');
    await wrapper.vm.$nextTick();

    // Spy on the $router.push method
    const routerPushSpy = jest.spyOn(wrapper.vm.$router, 'push');

    // Find the button and trigger a click event

    await button.trigger('click');

    // Verify the expected route was pushed to the router
    expect(routerPushSpy).toHaveBeenCalledWith({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: '_' }, // Replace with actual cluster id if necessary
      query:  {
        'repo-type':  'cluster',
        repo:        'kubewarden',
        chart:       'kubewarden-controller',
        version:     '2.0.5'
      }
    });
  });

  it('chartRoute returns RC version when showPreRelease is true', async() => {
    commonMocks.$store.getters['prefs/get'].mockImplementation((key) => {
      if ( key === SHOW_PRE_RELEASE ) {
        return true;
      }

      return undefined;
    });

    const wrapper = createWrapper({
      data() {
        return { initStepIndex: 1 };
      },
      computed: {
        kubewardenRepo:   () => true,
        controllerChart:  () => controllerCharts,
        showPreRelease:   () => true
      }
    });

    const installButton = wrapper.find('[data-testid="kw-initial-install-button"]');

    installButton.trigger('click');

    await wrapper.vm.$nextTick();

    // Find the button and trigger a click event
    const button = wrapper.find('[data-testid="kw-app-install-button"]');

    button.trigger('click');
    await wrapper.vm.$nextTick();

    // Spy on the $router.push method
    const routerPushSpy = jest.spyOn(wrapper.vm.$router, 'push');

    // Find the button and trigger a click event

    await button.trigger('click');

    // Verify the expected route was pushed to the router
    expect(routerPushSpy).toHaveBeenCalledWith({
      name:   'c-cluster-apps-charts-install',
      params: { cluster: '_' }, // Replace with actual cluster id if necessary
      query:  {
        'repo-type':  'cluster',
        repo:        'kubewarden',
        chart:       'kubewarden-controller',
        version:     '2.0.6-rc1'
      }
    });
  });
});
