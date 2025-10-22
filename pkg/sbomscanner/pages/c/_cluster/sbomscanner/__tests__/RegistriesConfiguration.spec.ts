import { mount, flushPromises } from '@vue/test-utils';
import RegistriesOverview from '../RegistriesConfiguration.vue';
import { getPermissions } from '../../../../../utils/permissions';
const day = require('dayjs');

// --- MOCKS ---
jest.mock('@pkg/components/RecentUpdatedRegistries', () => ({
  name: 'RecentUpdatedRegistries',
  template: '<div class="mock-recent"></div>',
}));
jest.mock('@pkg/components/DistributionChart', () => ({
  name: 'DistributionChart',
  template: '<div class="mock-distribution"></div>',
}));
jest.mock('@pkg/list/sbomscanner.kubewarden.io.registry.vue', () => ({
  name: 'RegistryResourceTable',
  template: '<div class="mock-table"></div>',
}));
jest.mock('@pkg/utils/permissions', () => ({
  getPermissions: jest.fn(() => ({ canEdit: true })),
}));


const mockT = (key: string) => key;

const mockStore = {
  dispatch: jest.fn().mockResolvedValue([]),
  getters: {
    'cluster/schemaFor': jest.fn().mockReturnValue({ kind: 'Registry' }),
    'cluster/paginationEnabled': jest.fn().mockReturnValue(false),
  },
};

const mockRouter = {
  push: jest.fn(),
};

const mockRoute = {
  params: { cluster: 'mock-cluster' },
};

// --- HELPER FOR MOUNT ---
const factory = (options = {}) =>
  mount(RegistriesOverview, {
    global: {
      mocks: {
        $store: mockStore,
        $router: mockRouter,
        $route: mockRoute,
        t: mockT,
        $t: mockT,
      },
    },
    ...options,
  });

describe('RegistriesOverview.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- BASIC RENDER ---
  it('renders correctly and shows title', async () => {
    const wrapper = factory();
    await flushPromises();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.title').text()).toContain('imageScanner.registries.title');
    expect(wrapper.find('.mock-recent').exists()).toBe(true);
    expect(wrapper.find('.mock-distribution').exists()).toBe(true);
    expect(wrapper.find('.mock-table').exists()).toBe(true);
  });

  it('navigates when clicking Add new button', async () => {
    // ensure getPermissions returns canEdit true
    getPermissions.mockReturnValueOnce({ canEdit: true });

    const wrapper = factory();
    await flushPromises();

    const addButton = wrapper.find('button[aria-label="Add new"]');
    expect(addButton.exists()).toBe(true);

    await addButton.trigger('click');

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringContaining('c-cluster-resource-create'),
        params: expect.objectContaining({
          cluster: 'mock-cluster',
        }),
      })
    );
  });

  // --- COMPUTED ---
  it('computes schema and pagination correctly', async () => {
    const wrapper = factory();

    expect(wrapper.vm.schema).toEqual({ kind: 'Registry' });
    expect(wrapper.vm.canPaginate).toBe(false);
  });

  it('formats latestUpdateDateText and latestUpdateTimeText correctly', () => {
    const wrapper = factory();
    wrapper.vm.latestUpdateTime = new Date('2024-10-01T12:30:00Z');

    expect(wrapper.vm.latestUpdateDateText).toContain(day(wrapper.vm.latestUpdateTime).format('MMM'));
    expect(wrapper.vm.latestUpdateTimeText).toContain(day(wrapper.vm.latestUpdateTime).format('h'));
  });

  // --- METHODS ---
  it('calls loadData and sets keepAliveTimer', async () => {
    jest.useFakeTimers();
    const wrapper = factory();

    await wrapper.vm.loadData();
    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: expect.any(String) });
    expect(wrapper.vm.keepAliveTimer).not.toBeNull();

    jest.useRealTimers();
  });

  it('clears timer on unmount', async () => {
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
          { type: 'InProgress', status: 'True', lastTransitionTime: '2024-10-01' },
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
        conditions: [
          { type: 'Pending' },
          { type: 'InProgress' },
          { type: 'Complete' },
        ],
      },
    ];
    expect(wrapper.vm.getPreviousStatus(scanjobs)).toBe('inprogress');
  });

  it('getPreviousStatus returns fallback when no previous', () => {
    const wrapper = factory();
    expect(wrapper.vm.getPreviousStatus([])).toBe('none');
  });

  it('getSummaryData computes registryStatusList and summary', () => {
    const wrapper = factory();

    const mockJobs = [
      {
        metadata: {
          namespace: 'ns1',
          name: 'job1',
          annotations: { 'sbomscanner.kubewarden.io/registry': JSON.stringify({ spec: { uri: 'docker.io' } }) },
          creationTimestamp: new Date().toISOString(),
        },
        spec: { registry: 'r1' },
        status: {
          conditions: [{ type: 'Complete', status: 'True', lastTransitionTime: new Date().toISOString() }],
          completionTime: new Date().toISOString(),
        },
      },
    ];

    const res = wrapper.vm.getSummaryData(mockJobs);
    expect(res.statusSummary.complete).toBe(1);
    expect(res.registryStatusList.length).toBe(5); // filled to 5
  });

  it('filterByStatus updates selectedStatus', () => {
    const wrapper = factory();
    wrapper.vm.filterByStatus('complete');
    expect(wrapper.vm.selectedStatus).toBe('complete');
  });
  it('fetchSecondaryResources calls store if !canPaginate', async () => {
    const wrapper = factory();
    const res = await wrapper.vm.fetchSecondaryResources({ canPaginate: false });
    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: expect.any(String) });
    expect(res).toEqual([]);
  });

  it('fetchPageSecondaryResources calls cluster/findPage', async () => {
    mockStore.dispatch.mockResolvedValueOnce([{ id: 1 }]);
    const wrapper = factory();
    const res = await wrapper.vm.fetchPageSecondaryResources({
      canPaginate: false,
      force: false,
      page: [{ metadata: { namespace: 'ns1', name: 'n1' } }],
    });
    expect(mockStore.dispatch).toHaveBeenCalledWith('cluster/findPage', expect.any(Object));
    expect(res).toEqual([{ id: 1 }]);
  });
});