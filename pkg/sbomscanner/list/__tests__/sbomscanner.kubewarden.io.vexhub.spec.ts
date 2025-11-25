import { jest } from '@jest/globals';
import { shallowMount, flushPromises } from '@vue/test-utils';
import VexHubList from '../sbomscanner.kubewarden.io.vexhub.vue';
import ResourceTable from '@shell/components/ResourceTable';
import { RESOURCE, PRODUCT_NAME } from '@sbomscanner/types';
import { VEX_MANAGEMENT_TABLE } from '@sbomscanner/config/table-headers';

jest.mock('@sbomscanner/types', () => ({
  RESOURCE:     { VEX_HUB: 'test.vexhub' },
  PRODUCT_NAME: 'test-product'
}));

jest.mock('@sbomscanner/config/table-headers', () => ({ VEX_MANAGEMENT_TABLE: [{ name: 'name', label: 'Name' }] }));

describe('VexHubList.vue', () => {
  let wrapper;
  let mockDispatch;
  let mockGetAll;
  let mockSchemaFor;
  let mockFetch;

  const mockVexHubs = [
    {
      id: 'hub1', spec: { enabled: true }, save: jest.fn()
    },
    {
      id: 'hub2', spec: { enabled: false }, save: jest.fn()
    },
  ];
  const mockSchema = { id: 'test.vexhub', attributes: { namespaced: false } };

  const mountComponent = () => {
    mockDispatch = jest.fn().mockResolvedValue(true);
    mockGetAll = jest.fn().mockReturnValue(mockVexHubs);
    mockSchemaFor = jest.fn().mockReturnValue(mockSchema);
    mockFetch = jest.fn();

    wrapper = shallowMount(VexHubList, {
      global: {
        mocks: {
          $store: {
            dispatch: mockDispatch,
            getters:  {
              'cluster/all':       mockGetAll,
              'cluster/schemaFor': mockSchemaFor,
            }
          },
          $fetch:      mockFetch,
          $fetchState: { pending: false },
        },
        stubs: { ResourceTable: true }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mountComponent();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('should mount and initialize data correctly', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.PRODUCT_NAME).toBe(PRODUCT_NAME);
    expect(wrapper.vm.headers).toEqual(VEX_MANAGEMENT_TABLE);
    expect(wrapper.vm.rows).toEqual([]); // Initially empty before fetch
  });

  describe('fetch hook', () => {
    it('should dispatch findAll and populate rows', async() => {
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.VEX_HUB });
      expect(mockGetAll).toHaveBeenCalledWith(RESOURCE.VEX_HUB);
      expect(wrapper.vm.rows).toEqual(mockVexHubs);
    });

    it('should handle empty response from store', async() => {
      mockGetAll.mockReturnValueOnce(null); // Simulate no CRDs found

      await wrapper.vm.$options.fetch.call(wrapper.vm);

      expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.VEX_HUB });
      expect(mockGetAll).toHaveBeenCalledWith(RESOURCE.VEX_HUB);
      expect(wrapper.vm.rows).toEqual([]);
    });
  });

  describe('computed schema', () => {
    it('should get schema from store', () => {
      const schema = wrapper.vm.schema;

      expect(mockSchemaFor).toHaveBeenCalledWith(RESOURCE.VEX_HUB);
      expect(schema).toEqual(mockSchema);
    });
  });

  describe('ResourceTable rendering', () => {
    it('should render ResourceTable', () => {
      expect(wrapper.findComponent(ResourceTable).exists()).toBe(true);
    });

    it('should pass correct props to ResourceTable', () => {
      const table = wrapper.findComponent(ResourceTable);

      expect(table.props('schema')).toEqual(mockSchema);
      expect(table.props('rows')).toEqual([]); // Before fetch completes
      expect(table.props('headers')).toEqual(VEX_MANAGEMENT_TABLE);
      expect(table.props('namespaced')).toBe(false);
      expect(table.props('keyField')).toBe('id');
      expect(table.props('tableActions')).toBe(true);
      expect(table.props('useQueryParamsForSimpleFiltering')).toBe(true);
    });
  });

  describe('switchStatus method', () => {
    it('should update status using selected argument', async() => {
      const selectedArg = [
        {
          id: 'hub3', spec: {}, save: jest.fn().mockResolvedValue({})
        },
        {
          id: 'hub4', spec: { enabled: true }, save: jest.fn().mockResolvedValue({})
        }
      ];

      await wrapper.vm.switchStatus(false, selectedArg);

      expect(selectedArg[0].spec.enabled).toBe(false);
      expect(selectedArg[0].save).toHaveBeenCalledTimes(1);
      expect(selectedArg[1].spec.enabled).toBe(false);
      expect(selectedArg[1].save).toHaveBeenCalledTimes(1);

      await flushPromises();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should update status using selectedRows data property', async() => {
      const selectedData = [
        {
          id: 'hub5', spec: {}, save: jest.fn().mockResolvedValue({})
        },
      ];

      await wrapper.setData({ selectedRows: selectedData });

      await wrapper.vm.switchStatus(true);

      expect(selectedData[0].spec.enabled).toBe(true);
      expect(selectedData[0].save).toHaveBeenCalledTimes(1);

      await flushPromises();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should not do anything if no resources are selected', async() => {
      await wrapper.setData({ selectedRows: [] });
      await wrapper.vm.switchStatus(true);

      expect(mockFetch).toHaveBeenCalledTimes(0);
    });

    it('should handle save errors gracefully (no throw)', async() => {
      const errorResource = {
        id: 'hubError', spec: {}, save: jest.fn().mockRejectedValue('Save failed')
      };

      await wrapper.setData({ selectedRows: [errorResource] });

      await expect(wrapper.vm.switchStatus(true)).rejects.toMatch('Save failed');

      expect(errorResource.spec.enabled).toBe(true); // Still tries to set it
      expect(errorResource.save).toHaveBeenCalledTimes(1);

      await flushPromises();
      expect(mockFetch).toHaveBeenCalledTimes(0);
    });
  });
});
