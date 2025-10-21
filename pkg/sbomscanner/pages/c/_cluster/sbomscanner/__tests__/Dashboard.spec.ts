import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Dashboard from '../Dashboard.vue';
import { shallowMount } from '@vue/test-utils';

// Define RESOURCE constants locally to avoid import issues
const RESOURCE = {
  REGISTRY: "sbomscanner.kubewarden.io.registry",
  SCAN_JOB: "sbomscanner.kubewarden.io.scanjob"
};

describe('Dashboard', () => {
  let store: any;
  let wrapper: any;

  beforeEach(() => {
    store = createStore({
      modules: {
        cluster: {
          namespaced: true,
          getters: {
            'all': () => (type: string) => {
              if (type === RESOURCE.REGISTRY) return [];
              if (type === RESOURCE.SCAN_JOB) return [];
              return [];
            }
          },
          actions: {
            'findAll': jest.fn()
          }
        }
      }
    });

    wrapper = mount(Dashboard, {
      global: {
        plugins: [store],
        mocks: {
          $route: {
            params: { cluster: 'test-cluster' }
          },
          $router: {
            push: jest.fn()
          },
          $t: (key: string) => key,
          $store: store
        },
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
            props: ['to']
          },
          LabeledSelect: {
            template: '<select class="labeled-select"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>',
            props: ['value', 'options', 'closeOnSelect', 'multiple']
          },
          SevereVulnerabilitiesItem: {
            template: '<div class="severe-vulnerabilities-item"><slot /></div>',
            props: ['vulnerability']
          },
          TopSevereVulnerabilitiesChart: {
            template: '<div class="top-severe-vulnerabilities-chart"></div>',
            props: ['topSevereVulnerabilities']
          },
          ImageRiskAssessment: {
            template: '<div class="image-risk-assessment"></div>',
            props: ['vulnerabilityStats', 'scanningStats', 'chartData']
          },
          TopRiskyImagesChart: {
            template: '<div class="top-risky-images-chart"></div>',
            props: ['topRiskyImages']
          }
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('Component Initialization', () => {
    it('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display the correct title', () => {
      expect(wrapper.find('.title').text()).toContain('imageScanner.dashboard.title');
    });

    it('should display the registry filter dropdown', () => {
      const labeledSelect = wrapper.find('.labeled-select');
      expect(labeledSelect.exists()).toBe(true);
    });
  });

  describe('Component Data', () => {
    it('should have correct initial data properties', () => {
      expect(wrapper.vm.PRODUCT_NAME).toBeDefined();
      expect(wrapper.vm.disabled).toBe(false);
      expect(wrapper.vm.selectedRegistry).toBe('All registries');
      expect(wrapper.vm.registryOptions).toBeDefined();
    });
  });

  // Fake SCAN_JOB data
  function makeScanJob({
    namespace = 'default',
    registry = 'my-registry',
    scannedImagesCount = 5,
    imagesCount = 10,
    hasError = false,
    completionTime = Date.now(),
  } = {}) {
    return {
      metadata: { namespace },
      spec: { registry },
      status: {
        scannedImagesCount,
        completionTime,
        conditions: hasError ? [{ error: 'Some error' }] : []
      },
      imagesCount
    };
  }
  describe('Dashboard.vue', () => {
    let storeMock;

    beforeEach(() => {
      storeMock = {
        dispatch: jest.fn().mockResolvedValue([]),
        getters: {
          'cluster/all': jest.fn(() => [makeScanJob()]),
          'cluster/canList': jest.fn(() => true),
          'cluster/schemaFor': jest.fn(() => ({})),
          'cluster/paginationEnabled': jest.fn(() => false)
        }
      };
    });

    function factory(options = {}) {
      return shallowMount(Dashboard, {
        global: {
          mocks: {
            $store: storeMock,
            t: (key) => key // simple i18n mock
          }
        },
        ...options
      });
    }

     it('Show statement if no scan has been started yet', async () => {
      const wrapper = factory();
      await wrapper.setData({
        scanJobsCRD: [makeScanJob()]
      });
      wrapper.vm.scaningStats.lastCompletionTimestamp = 0;

      expect(wrapper.vm.durationFromLastScan).toContain('imageScanner.dashboard.scanningStatus.initialDuration');
    });

    it('computes durationFromLastScan correctly (2 hours ago)', async () => {
      const wrapper = factory();
      await wrapper.setData({
        scanJobsCRD: [makeScanJob()]
      });
      wrapper.vm.scaningStats.lastCompletionTimestamp = Date.now() - 2 * 60 * 60 * 1000;

      expect(wrapper.vm.durationFromLastScan).toContain('2 hours');
    });

    it('shows seconds if less than 1 minute', () => {
      const wrapper = factory();
      wrapper.vm.scaningStats.lastCompletionTimestamp = Date.now() - 45 * 1000;
      expect(wrapper.vm.durationFromLastScan).toContain('seconds');
    });

    it('shows minutes if less than 1 hour', () => {
      const wrapper = factory();
      wrapper.vm.scaningStats.lastCompletionTimestamp = Date.now() - 15 * 60 * 1000;
      expect(wrapper.vm.durationFromLastScan).toContain('minutes');
    });

    it('pluralizes displayed counts correctly', async () => {
      const wrapper = factory();
      await wrapper.setData({
        scaningStats: { detectedErrorCnt: 1, failedImagesCnt: 1, totalScannedImageCnt: 5 }
      });
      expect(wrapper.vm.displayedDetectedErrorCnt).toBe('1 error');
      expect(wrapper.vm.displayedFailedImagesCnt).toBe('1 image');
      expect(wrapper.vm.displayedTotalScannedImageCnt).toBe('5 images');
    });

    it('builds registryOptions including "All registries"', async () => {
      const wrapper = factory();
      await wrapper.setData({
        scanJobsCRD: [makeScanJob(
          {
            namespace: 'default',
            registry: 'my-registry',
            scannedImagesCount: 5,
            imagesCount: 10,
            hasError: false,
            completionTime: Date.now(),
          }
        )]
      });

      const options = wrapper.vm.registryOptions;
      expect(options[0]).toBe('All registries');
      expect(options.find(o => o === 'default/my-registry')).toBeTruthy();
    });
  });
});