import { mount, flushPromises } from '@vue/test-utils';
import RegistryDetails from '../RegistryDetails.vue';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import RancherMeta from '../common/RancherMeta.vue';
import StatusBadge from '../common/StatusBadge.vue';
import RegistryDetailScanTable from '../RegistryDetailScanTable.vue';
import ScanButton from '../common/ScanButton.vue';
import { getPermissions } from '../../utils/permissions';

jest.mock('@sbomscanner/utils/permissions', () => ({ getPermissions: jest.fn(() => ({ canEdit: true })) }));
describe('RegistryDetails.vue', () => {

  let storeMock: any;
  let tMock: any;
  const mockRouter = { push: jest.fn() };

  const registryMock = {
    metadata: { name: 'my-reg', namespace: 'ns1' },
    spec:     {
      uri:          'http://test.registry',
      repositories: ['repo1', 'repo2'],
      scanInterval: '5m',
    },
    scanRec: { currStatus: 'complete' },
  };

  const scanJobsMock = [
    { spec: { registry: 'my-reg' } },
    { spec: { registry: 'other-reg' } },
  ];

  const factory = (options = {}) => {
    storeMock = {
      dispatch: jest.fn((action) => {
        if (action === 'cluster/find') {
          return Promise.resolve(registryMock);
        } else if (action === 'cluster/findAll') {
          return Promise.resolve(scanJobsMock);
        }
      }),
    };

    tMock = jest.fn((str, vars) => {
      if (vars?.i) return `Every ${vars.i}`;

      return str;
    });

    return mount(RegistryDetails, {
      global: {
        mocks: {
          $store:      storeMock,
          $fetchState: { pending: false },
          $route:      {
            params: {
              cluster: 'local', id: 'my-reg', ns: 'ns1'
            }
          },
          $router: mockRouter,
          t:       tMock,
        },
        stubs: {
          RouterLink:              { template: '<a><slot /></a>' },
          ActionMenu:              true,
          RancherMeta:             true,
          StatusBadge:             true,
          RegistryDetailScanTable: true,
          ScanButton:              true,
        },
      },
      ...options,
    });
  };

  it('renders header and basic structure', async() => {
    getPermissions.mockReturnValueOnce({ canEdit: true });
    const wrapper = factory();

    expect(wrapper.find('.registry-details').exists()).toBe(true);
    expect(wrapper.find('.header').exists()).toBe(true);
  });

  it('calls loadData() on fetch hook', async() => {
    const wrapper = factory();
    const spy = jest.spyOn(wrapper.vm, 'loadData');

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    expect(spy).toHaveBeenCalled();
  });

  it('loadData populates registry, status, metadata, and scanHistory', async() => {
    const wrapper = factory();

    await wrapper.vm.loadData();

    expect(storeMock.dispatch).toHaveBeenCalledWith('cluster/find', expect.any(Object));
    expect(storeMock.dispatch).toHaveBeenCalledWith('cluster/findAll', expect.any(Object));

    expect(wrapper.vm.registry).toEqual(registryMock);
    expect(wrapper.vm.registry.scanRec.currStatus).toBe('complete');
    expect(wrapper.vm.scanHistory).toEqual([{ spec: { registry: 'my-reg' } }]);
    expect(wrapper.vm.registryMetadata.length).toBeGreaterThan(0);

    // Validate t() calls
    expect(tMock).toHaveBeenCalledWith('imageScanner.registries.configuration.meta.namespace');
  });

  it('renders ActionMenu only when registry is set', async() => {
    const wrapper = factory();

    // initially null
    expect(wrapper.findComponent(ActionMenu).exists()).toBe(false);

    await wrapper.vm.loadData();
    await wrapper.vm.$nextTick();

    // ActionMenu visible
    expect(wrapper.findComponent(ActionMenu).exists()).toBe(true);
  });

  it('renders child components', async() => {
    const wrapper = factory();

    await wrapper.vm.loadData();
    await flushPromises();

    expect(wrapper.findComponent(RancherMeta).exists()).toBe(true);
    expect(wrapper.findComponent(StatusBadge).exists()).toBe(true);
    expect(wrapper.findComponent(RegistryDetailScanTable).exists()).toBe(true);
    expect(wrapper.findComponent(ScanButton).exists()).toBe(true);
  });

  it('computes correct metadata values', async() => {
    const wrapper = factory();

    await wrapper.vm.loadData();

    const meta = wrapper.vm.registryMetadata;
    const nsMeta = meta.find((m: any) => m.label === 'imageScanner.registries.configuration.meta.namespace');
    const repoMeta = meta.find((m: any) => m.label === 'imageScanner.registries.configuration.meta.repositories');
    const uriMeta = meta.find((m: any) => m.label === 'imageScanner.registries.configuration.meta.uri');
    const tagsMeta = meta.find((m: any) => m.type === 'tags');

    expect(nsMeta.value).toBe('ns1');
    expect(repoMeta.value).toBe(2);
    expect(uriMeta.value).toBe('http://test.registry');
    expect(tagsMeta.tags).toEqual(['repo1', 'repo2']);
  });

  it('handles empty repositories and scanInterval gracefully', async() => {
    const wrapper = factory();

    registryMock.spec.repositories = undefined;
    registryMock.spec.scanInterval = undefined;
    await wrapper.vm.loadData();

    const repoMeta = wrapper.vm.registryMetadata.find((m: any) => m.label === 'imageScanner.registries.configuration.meta.repositories');
    const scheduleMeta = wrapper.vm.registryMetadata[5];// scanInterval

    expect(repoMeta.value).toBe(0);
    expect(scheduleMeta?.value).toBe('');
  });

});
