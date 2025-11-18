import { shallowMount } from '@vue/test-utils';
import Registries from '../sbomscanner.kubewarden.io.registry.vue';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import { getPermissions } from '../../utils/permissions';

// Mock lodash debounce to call immediately
jest.mock('lodash', () => {
  const actual = jest.requireActual('lodash');

  return {
    ...actual,
    debounce: jest.fn((fn) => fn),
  };
});

jest.mock('@sbomscanner/utils/permissions', () => ({ getPermissions: jest.fn() }));

// jest.mock('@shell/types/store/pagination.types', () => ({ 
//   PaginationParamFilter: { createMultipleFields: jest.fn((fields) => ({ createdFilter: true, fields })) }
// }));

jest.mock('@shell/types/store/pagination.types', () => {
  class PaginationFilterField {
    constructor({ field, value }) {
      this.field = field;
      this.value = value;
    }
  }

  class FilterArgs {
    constructor({ filters }) {
      this.filters = filters;
    }
  }

  const PaginationParamFilter = {
    createMultipleFields: jest.fn((fields) => ({ createdFilter: true, fields })),
  };

  return { PaginationFilterField, FilterArgs, PaginationParamFilter };
});



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

const factory = (options = {}) =>
  shallowMount(Registries, {
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

describe('Registries.vue', () => {
  let wrapper: any;
  let mockStore;

  beforeEach(() => {
    mockStore = {
      dispatch: jest.fn().mockResolvedValue([]),
      getters: {
        'cluster/schemaFor':         jest.fn(() => ({ schema: 'test-schema' })),
        'cluster/paginationEnabled': jest.fn(() => true),
      },
    };

    getPermissions.mockReturnValue({
      canEdit:   true,
      canDelete: true,
    });

    wrapper = shallowMount(Registries, {
      global: {
        mocks: {
          $store: mockStore,
          t:      (key: any) => key,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and initializes filters', () => {
    expect(wrapper.vm.filters.registrySearch).toBe('');
    expect(wrapper.vm.filterStatusOptions.length).toBeGreaterThan(0);
  });

  it('handles onSelectionChange correctly', () => {
    const mockRows = [{ id: 1 }, { id: 2 }];

    wrapper.vm.onSelectionChange(mockRows);
    expect(wrapper.vm.selectedRows).toEqual(mockRows);

    wrapper.vm.onSelectionChange(undefined);
    expect(wrapper.vm.selectedRows).toEqual([]);
  });

    it('runs promptRemoveRegistry when action exists', async () => {
      const mockAct = { action: 'promptRemove' };
      const mockTable = {
        availableActions: [mockAct],
        setBulkActionOfInterest: jest.fn(),
        applyTableAction: jest.fn(),
      };
      
      Object.defineProperty(wrapper.vm.$, 'refs', {
        value: Object.defineProperty({}, 'registryTable', {
          value: {
            $refs: {
              table: {
                $refs: {
                  table: mockTable,
                },
              },
            },
          },
        }),
        configurable: true,
      });
      
      await wrapper.vm.promptRemoveRegistry();
      expect(mockTable.setBulkActionOfInterest).toHaveBeenCalledWith(mockAct);
      expect(mockTable.applyTableAction).toHaveBeenCalledWith(mockAct);
    });

    it('skips promptRemoveRegistry when action not found', async () => {
      const mockTable = {
        availableActions: [],
        setBulkActionOfInterest: jest.fn(),
        applyTableAction: jest.fn(),
      };

      Object.defineProperty(wrapper.vm.$, 'refs', {
        value: Object.defineProperty({}, 'registryTable', {
          value: {
            $refs: {
              table: {
                $refs: {
                  table: mockTable,
                },
              },
            },
          },
        }),
        configurable: true,
      });
      await wrapper.vm.promptRemoveRegistry();
      expect(mockTable.setBulkActionOfInterest).not.toHaveBeenCalled();
    });

  it('filters rows locally by all fields - currStatus is String', () => {
    const rows = [
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: 'complete' },
      },
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: 'failed' },
      },
    ];

    wrapper.vm.debouncedFilters = {
      registrySearch:   'test',
      namespaceSearch:  'default',
      uriSearch:        'ghcr',
      repositorySearch: 'repo1',
      statusSearch:     'complete',
    };

    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(1);
  });

  it('filters rows locally by all fields - partial string matching for name and namespace', () => {
    const rows = [
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: 'complete' },
      },
      {
        metadata: { name: 'test1', namespace: 'default1' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: 'complete' },
      },
    ];

    wrapper.vm.debouncedFilters = {
      registrySearch:   'test',
      namespaceSearch:  'default',
      uriSearch:        'ghcr',
      repositorySearch: 'repo1',
      statusSearch:     'complete',
    };

    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(2);
  });

  it('filters rows locally by all fields - currStatus is Object', () => {
    const rows = [
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: { value: 'complete' } },
      },
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: { value: 'failed' } },
      },
    ];

    wrapper.vm.debouncedFilters = {
      registrySearch:   'test',
      namespaceSearch:  'default',
      uriSearch:        'ghcr',
      repositorySearch: 'repo1',
      statusSearch:     { value: 'complete' }
    };

    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(1);
  });

  it('returns true when statusSearch is "any" - currStatus is String', () => {
    const rows = [
      {
        metadata: { name: 'foo' },
        spec:     { uri: 'bar' },
        scanRec:  { currStatus: 'failed' },
      },
      {
        metadata: { name: 'foo' },
        spec:     { uri: 'bar' },
        scanRec:  { currStatus: 'complete' },
      },
    ];

    wrapper.vm.debouncedFilters.statusSearch = { value: 'any' };
    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result.length).toBe(2);
  });

  it('returns true when statusSearch is "any" - currStatus is Object', () => {
    const rows = [
      {
        metadata: { name: 'foo' },
        spec:     { uri: 'bar' },
        scanRec:  { currStatus: { value: 'failed' } },
      },
      {
        metadata: { name: 'foo' },
        spec:     { uri: 'bar' },
        scanRec:  { currStatus: { value: 'complete' } },
      },
    ];

    wrapper.vm.debouncedFilters.statusSearch = { value: 'any' };
    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result.length).toBe(2);
  });

  it('filters rows when no match found', () => {
    wrapper.vm.debouncedFilters = {
      registrySearch:   'no-match',
      namespaceSearch:  '',
      uriSearch:        '',
      repositorySearch: '',
      statusSearch:     'complete',
    };
    const rows = [
      {
        metadata: { name: 'test', namespace: 'default' },
        spec:     { uri: 'ghcr.io', repositories: ['repo1', 'repo2'] },
        scanRec:  { currStatus: 'failed' },
      },
    ];
    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(0);
  });

  it('creates proper API filters in filterRowsApi() - statusSearch is String', () => {
    const pagination = { filters: [] };

    wrapper.vm.debouncedFilters = {
      registrySearch:   'r',
      namespaceSearch:  'n',
      uriSearch:        'u',
      repositorySearch: 'repo',
      statusSearch:     'complete',
    };

    const result = wrapper.vm.filterRowsApi(pagination);

    expect(PaginationParamFilter.createMultipleFields).toHaveBeenCalled();
    expect(result.filters[0].createdFilter).toBe(true);
  });

  it('creates proper API filters in filterRowsApi() - statusSearch is Object', () => {
    const pagination = { filters: [] };

    wrapper.vm.debouncedFilters = {
      registrySearch:   'r',
      namespaceSearch:  'n',
      uriSearch:        'u',
      repositorySearch: 'repo',
      statusSearch:     { value: 'complete' },
    };

    const result = wrapper.vm.filterRowsApi(pagination);

    expect(PaginationParamFilter.createMultipleFields).toHaveBeenCalled();
    expect(result.filters[0].createdFilter).toBe(true);
  });

  it('computed schema and canPaginate work', () => {
    expect(wrapper.vm.schema).toEqual({ schema: 'test-schema' });
    expect(wrapper.vm.canPaginate).toBe(true);
  });

  it('watch: filters triggers debounce', async() => {
    wrapper.vm.filters.registrySearch = 'changed';
    await wrapper.vm.$nextTick();
    // verify side effect instead of spying
    expect(wrapper.vm.debouncedFilters.registrySearch).toBe('changed');
  });

  it('watch: statusFilterLink updates filters', async() => {
    wrapper.setProps({ statusFilterLink: 'complete' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.filters.statusSearch).toBe('complete');
  });

  it('fetchSecondaryResources calls store if !canPaginate', async() => {
    const wrapper = factory();
    const res = await wrapper.vm.fetchSecondaryResources({ canPaginate: false });

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: expect.any(String) });
    expect(res).toEqual([]);
  });

  it('fetchPageSecondaryResources returns undefined when page empty', async() => {
    const wrapper = factory();
    const res = await wrapper.vm.fetchPageSecondaryResources({
      canPaginate: false, force: false, page: []
    });

    expect(res).toBeUndefined();
  });


  it('fetchPageSecondaryResources calls cluster/findPage', async() => {
    mockStore.dispatch = jest.fn().mockResolvedValue([{ id: 'ns1/n1' }]);
    const wrapper = factory({ mockStore });
    const res = await wrapper.vm.fetchPageSecondaryResources({
      canPaginate: false,
      force:       false,
      page:        [{ metadata: { namespace: 'ns1', name: 'n1' } }],
    });

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('cluster/findPage', expect.any(Object));
    // expect(res).toEqual([{ id: 'ns1/n1' }]);
  });
});
