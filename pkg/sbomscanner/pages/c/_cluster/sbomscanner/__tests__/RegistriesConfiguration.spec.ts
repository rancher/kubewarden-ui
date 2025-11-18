import { mount, flushPromises } from '@vue/test-utils';
import RegistriesOverview from '../RegistriesConfiguration.vue';
import { getPermissions } from '../../../../../utils/permissions';
import { scanJobs4General } from '../../../../../test/mockdata/scanJobs';


const day = require('dayjs');

// --- MOCKS ---
jest.mock('@sbomscanner/components/RecentUpdatedRegistries', () => ({
  name:     'RecentUpdatedRegistries',
  template: '<div class="mock-recent"></div>',
}));
jest.mock('@sbomscanner/components/DistributionChart', () => ({
  name:     'DistributionChart',
  template: '<div class="mock-distribution"></div>',
}));
jest.mock('@sbomscanner/list/sbomscanner.kubewarden.io.registry.vue', () => ({
  name:     'RegistryResourceTable',
  template: '<div class="mock-table"></div>',
}));
jest.mock('@sbomscanner/utils/permissions', () => ({ getPermissions: jest.fn(() => ({ canEdit: true })) }));
jest.mock('@shell/utils/array', () => ({ findBy: jest.fn() }));


const mockT = (key: string) => key;

const mockStore = {
  dispatch: jest.fn().mockResolvedValue([]),
  getters:  {
    'cluster/schemaFor':         jest.fn().mockReturnValue({ kind: 'Registry' }),
    'cluster/paginationEnabled': jest.fn().mockReturnValue(false),
    'management/byId':           jest.fn().mockReturnValue({ kind: 'Registry' }),
  },
};

const mockRouter = { push: jest.fn() };

const mockRoute = { params: { cluster: 'mock-cluster' } };

// --- HELPER FOR MOUNT ---
const factory = (options = {}) =>
  mount(RegistriesOverview, {
    global: {
      mocks: {
        $store:  mockStore,
        $router: mockRouter,
        $route:  mockRoute,
        t:       mockT,
        $t:      mockT,
      },
    },
    ...options,
  });

describe('RegistriesOverview.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- BASIC RENDER ---
  it('renders correctly and shows title - No scan data', async() => {
    const wrapper = factory();

    (wrapper.vm as any).scanJobCRD = [];

    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.title').text()).toContain('imageScanner.registries.title');
    expect(wrapper.find('.mock-recent').exists()).toBe(false);
    expect(wrapper.find('.mock-distribution').exists()).toBe(false);
    expect(wrapper.find('.mock-table').exists()).toBe(true);
  });

  it('renders correctly and shows title - Has scan data', async() => {
    const wrapper = factory();

    (wrapper.vm as any).scanJobCRD = [
      { id: 'reg-mock-job-1' }
    ];

    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.title').text()).toContain('imageScanner.registries.title');
    expect(wrapper.find('.mock-recent').exists()).toBe(true);
    expect(wrapper.find('.mock-distribution').exists()).toBe(true);
    expect(wrapper.find('.mock-table').exists()).toBe(true);
  });

  it('navigates when clicking Add new button - readonly', async() => {
    // ensure getPermissions returns canEdit true
    getPermissions.mockReturnValueOnce({ canEdit: false });

    const wrapper = factory();

    await flushPromises();

    const addButton = wrapper.find('button[aria-label="Add new"]');

    expect(addButton.exists()).toBe(false);

  });

  it('navigates when clicking Add new button', async() => {
    // ensure getPermissions returns canEdit true
    getPermissions.mockReturnValueOnce({ canEdit: true });

    const wrapper = factory();

    await flushPromises();

    const addButton = wrapper.find('button[aria-label="Add new"]');

    expect(addButton.exists()).toBe(true);

    await addButton.trigger('click');

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name:   expect.stringContaining('c-cluster-resource-create'),
        params: expect.objectContaining({ cluster: 'mock-cluster' }),
      })
    );
  });

  it('calls loadData during fetch hook', async() => {
    const wrapper = factory();
    const loadDataSpy = jest.spyOn(wrapper.vm, 'loadData').mockResolvedValue();

    // Manually call Nuxt's fetch hook
    await wrapper.vm.$options.fetch.call(wrapper.vm);

    expect(loadDataSpy).toHaveBeenCalled();
  });


  it('shows summary section only when scanJobCRD has data', async() => {
    const wrapper = factory();

    (wrapper.vm as any).scanJobCRD = [];
    await flushPromises();
    expect(wrapper.find('.summary-section').exists()).toBe(false);

    (wrapper.vm as any).scanJobCRD = [{ id: 'test' }];
    await flushPromises();
    expect(wrapper.find('.summary-section').exists()).toBe(true);
  });


  // --- COMPUTED ---
  it('computes schema and pagination correctly', async() => {
    const wrapper = factory();

    expect(wrapper.vm.schema).toEqual({ kind: 'Registry' });
    expect(wrapper.vm.canPaginate).toBe(false);
  });

  it('formats latestUpdateDateText and latestUpdateTimeText correctly', () => {
    const wrapper = factory();

    (wrapper.vm as any).latestUpdateTime = new Date('2024-10-01T12:30:00Z');

    expect(wrapper.vm.latestUpdateDateText).toContain(day(wrapper.vm.latestUpdateTime).format('MMM D, YYYY'));
    expect(wrapper.vm.latestUpdateTimeText).toContain(day(wrapper.vm.latestUpdateTime).format('h:mm a'));
  });

  // --- METHODS ---
  it('calls loadData and sets keepAliveTimer', async() => {
    jest.useFakeTimers();
    const wrapper = factory();

    await wrapper.vm.loadData();
    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: expect.any(String) });
    expect(wrapper.vm.keepAliveTimer).not.toBeNull();

    jest.useRealTimers();
  });

  it('sets keepAliveTimer and periodically calls preprocessData', async() => {
    jest.useFakeTimers(); // enable fake timers

    const wrapper = factory();

    // ✅ Spy on preprocessData to check if called
    const preprocessSpy = jest.spyOn(wrapper.vm, 'preprocessData').mockResolvedValue();

    // ✅ Spy on global setInterval BEFORE loadData()
    const setIntervalSpy = jest.spyOn(global, 'setInterval');

    // Call the method that sets the interval
    await wrapper.vm.loadData();

    // Expect interval was created
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 20000);
    expect(wrapper.vm.keepAliveTimer).not.toBeNull();

    // Fast-forward 20 seconds
    jest.advanceTimersByTime(20000);
    await flushPromises();

    // Expect preprocessData to have been called again by the interval callback
    expect(preprocessSpy).toHaveBeenCalled();

    // Cleanup
    setIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it('calls loadData when refresh is called', async() => {
    const wrapper = factory();
    const loadDataSpy = jest.spyOn(wrapper.vm, 'loadData').mockResolvedValue();

    await wrapper.vm.refresh();

    expect(loadDataSpy).toHaveBeenCalled();
  });

  it('onSelectionChange updates selectedRows properly', async() => {
    const wrapper = factory();

    // Case 1: With valid array
    const mockSelected = [{ id: 1 }, { id: 2 }];

    wrapper.vm.onSelectionChange(mockSelected);
    expect(wrapper.vm.selectedRows).toEqual(mockSelected);

    // Case 2: With null or undefined → should default to []
    wrapper.vm.onSelectionChange(null);
    expect(wrapper.vm.selectedRows).toEqual([]);
  });

  it('clears timer on unmount', async() => {
    jest.useFakeTimers();
    const wrapper = factory();

    await wrapper.vm.loadData();
    const clearSpy = jest.spyOn(global, 'clearInterval');

    wrapper.unmount();
    expect(clearSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('getUri parses registry JSON correctly', () => {
    const wrapper = factory();

    const good = wrapper.vm.getUri(JSON.stringify({ spec: { uri: 'docker.io' } }));
    const bad = wrapper.vm.getUri('{ bad json }');

    expect(good).toBe('docker.io');
    expect(bad).toBe('');
  });

  it('getStatusResult returns pending if no status', () => {
    const wrapper = factory();
    const result = wrapper.vm.getStatusResult({});

    expect(result.type).toBe('Pending');
  });

  it('getStatusResult returns active type if found', () => {
    const wrapper = factory();
    const result = wrapper.vm.getStatusResult({
      status: {
        conditions: [
          { type: 'Complete', status: 'False' },
          {
            type: 'InProgress', status: 'True', lastTransitionTime: '2024-10-01'
          },
        ],
      },
    });

    expect(result.type).toBe('InProgress');
  });

  it('getPreviousStatus returns correct previous condition', () => {
    const wrapper = factory();
    const scanjobs = [
      {
        statusResult: { statusIndex: 2 },
        conditions:   [
          { type: 'Scheduled' },
          { type: 'InProgress' },
          { type: 'Complete' },
        ],
      },
    ];

    expect(wrapper.vm.getPreviousStatus(scanjobs)).toBe('inprogress');
  });

  it('getPreviousStatus returns previous status when index < 3', () => {
    const wrapper = factory();
    const scanjobs = [
      {
        statusResult: { statusIndex: 1 },
        conditions:   [{ type: 'Scheduled' }, { type: 'InProgress' }],
      },
    ];

    expect(wrapper.vm.getPreviousStatus(scanjobs)).toBe('scheduled');
  });

  it('getPreviousStatus returns from second job if first has no previous', () => {
    const wrapper = factory();
    const scanjobs = [
      { statusResult: { statusIndex: -1 } },
      { statusResult: { type: 'Complete' } },
    ];

    expect(wrapper.vm.getPreviousStatus(scanjobs)).toBe('complete');
  });

  it('getStatusResult returns Pending if no True condition found', () => {
    const wrapper = factory();
    const result = wrapper.vm.getStatusResult({ status: { conditions: [{ type: 'Scheduled', status: 'False' }] } });

    expect(result.type).toBe('Pending');
  });


  it('getPreviousStatus returns fallback when no previous', () => {
    const wrapper = factory();

    expect(wrapper.vm.getPreviousStatus([])).toBe('none');
  });

  it('getPreviousStatus returns fallback when no previous', () => {
    const wrapper = factory();

    expect(wrapper.vm.getPreviousStatus([
      {
        statusResult: { type: 'InProgress', statusIndex: 1 } ,
        conditions:   [{ type: 'Scheduled', status: 'False' }, { type: 'InProgress', status: 'True' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'False' }]
      },
      {
        statusResult: { type: 'Failed', statusIndex: 3 },
        conditions:   [{ type: 'Scheduled', status: 'False' }, { type: 'InProgress', status: 'False' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'True' }]
      },
    ])).toBe('scheduled');
    expect(wrapper.vm.getPreviousStatus([
      {
        statusResult: { type: 'Failed', statusIndex: 3 } ,
        conditions:   [{ type: 'Scheduled', status: 'False' }, { type: 'InProgress', status: 'False' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'True' }]
      },
      {
        statusResult: { type: 'Failed', statusIndex: 3 },
        conditions:   [{ type: 'Scheduled', status: 'False' }, { type: 'InProgress', status: 'False' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'True' }]
      },
    ])).toBe('inprogress');
    expect(wrapper.vm.getPreviousStatus([
      {
        statusResult: { type: 'Scheduled', statusIndex: 0 } ,
        conditions:   [{ type: 'Scheduled', status: 'True' }, { type: 'InProgress', status: 'True' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'False' }]
      },
      {
        statusResult: { type: 'Failed', statusIndex: 3 },
        conditions:   [{ type: 'Scheduled', status: 'False' }, { type: 'InProgress', status: 'False' }, { type: 'Complete', status: 'False' }, { type: 'Failed', status: 'True' }]
      },
    ])).toBe('failed');
  });

  it('getSummaryData computes registryStatusList and summary', () => {
    const wrapper = factory();

    const mockJobs = [
      {
        metadata: {
          namespace:         'ns1',
          name:              'job1',
          annotations:       { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: {
          conditions: [{
            type: 'Complete', status: 'True', lastTransitionTime: new Date().toISOString()
          }],
          completionTime: new Date().toISOString(),
        },
      },
      {
        metadata: {
          namespace:         'ns1',
          name:              'job4',
          annotations:       { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: { conditions: null },
      },
      {
        metadata: {
          namespace:         'ns1',
          name:              'job2',
          annotations:       { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: {
          conditions: [{
            type: 'Complete', status: 'True', lastTransitionTime: new Date(new Date().getTime() - 60).toISOString()
          }],
          completionTime: new Date().toISOString(),
        },
      },
      {
        metadata: {
          namespace:         'ns1',
          name:              'job3',
          annotations:       { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: null,
      },
    ];

    const res = wrapper.vm.getSummaryData(mockJobs);

    expect(res.statusSummary.complete).toBe(1);
    expect(res.registryStatusList.length).toBe(5); // filled to 5
  });

  it('getSummaryData handles jobs with no conditions safely', () => {
    const wrapper = factory();
    const mockJobs = [
      {
        metadata: {
          namespace:         'ns1',
          name:              'job1',
          annotations:       { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: {},
      },
    ];
    const res = wrapper.vm.getSummaryData(mockJobs);

    expect(res.registryStatusList.length).toBe(5);
  });

  it('getSummaryData tolerates malformed registry annotation JSON', () => {
    const wrapper = factory();
    const mockJobs = [
      {
        metadata: {
          namespace:         'ns1',
          name:              'job1',
          annotations:       { 'sbomscanner.kubewarden.io/registry': '{ bad json }' },
          creationTimestamp: new Date().toISOString(),
        },
        spec:   { registry: 'r1' },
        status: { conditions: [{ type: 'Pending', status: 'True' }] },
      },
    ];
    const res = wrapper.vm.getSummaryData(mockJobs);

    expect(res.registryStatusList.length).toBe(5);
  });

  it('filterByStatus updates selectedStatus', () => {
    const wrapper = factory();

    wrapper.vm.filterByStatus('complete');
    expect(wrapper.vm.selectedStatus).toBe('complete');
  });

  it('filterByStatus sets selectedStatus reactively', async() => {
    const wrapper = factory();

    wrapper.vm.filterByStatus('failed');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedStatus).toBe('failed');
  });

  it('getLastTransitionTime returns the latest timestamp', () => {
    const wrapper = factory();
    const conditions = [
      { lastTransitionTime: '2023-01-01T00:00:00Z' },
      { lastTransitionTime: '2024-01-01T00:00:00Z' },
    ];
    const res = wrapper.vm.getLastTransitionTime(conditions);

    expect(res).toBe(new Date('2024-01-01T00:00:00Z').getTime());
  });

  it('preprocessData resets and updates registryStatusList and statusSummary', async() => {
    const wrapper = factory();

    (wrapper.vm.scanJobCRD as any[]) = scanJobs4General.mock;
    await wrapper.vm.preprocessData();
    expect(wrapper.vm.registryStatusList).toBeDefined();
    expect(typeof wrapper.vm.statusSummary).toBe('object');
  });

  it('openAddEditRegistry navigates with expected params', () => {
    const wrapper = factory();

    wrapper.vm.openAddEditRegistry();
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name:   expect.stringContaining('-resource-create'),
        params: expect.objectContaining({
          cluster:  'mock-cluster',
          resource: expect.any(String),
        }),
      })
    );
  });
});