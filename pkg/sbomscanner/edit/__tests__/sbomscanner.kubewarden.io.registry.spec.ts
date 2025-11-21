import { shallowMount, Wrapper, flushPromises } from '@vue/test-utils';
import CruRegistry from '../sbomscanner.kubewarden.io.registry.vue';
import { SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { SCAN_INTERVALS, REGISTRY_TYPE } from '../../constants';

jest.mock('@sbomscanner/types', () => ({
  PRODUCT_NAME: 'kubewarden',
  PAGE:         { REGISTRIES: 'registries' },
  LOCAT_HOST:   [],
}));

const LabeledSelectStub = {
  name:     'LabeledSelect',
  template: `
    <select :data-testid="dataTestid" @change="$emit('input', value)" :required="required">
      <option
        v-for="opt in options"
        :key="opt[optionKey]"
        :value="opt[optionKey]"
      >
        {{ opt[optionLabel] }}
      </option>
    </select>
  `,
  props: ['value', 'options', 'optionKey', 'optionLabel', 'required', 'dataTestid'],
};

const stubs = {
  CruResource:       { name: 'CruResource', template: '<div><slot /></div>' },
  NameNsDescription: true,
  LabeledInput:      true,
  Banner:            { name: 'Banner', template: '<div><slot /></div>' },
  LabeledSelect:     LabeledSelectStub
};

const t = (key: string) => key;

const mockSecrets = [
  { metadata: { name: 'secret-1', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-2', namespace: 'other' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-3', namespace: 'default' }, _type: 'Opaque' },
];

const mockStore = {
  dispatch: jest.fn(),
  getters:  { currentProduct: { inStore: 'cluster' } },
};

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};
const mockRoute = { params: { cluster: 'c-123' } };

const defaultProps = {
  mode:  'create',
  value: {
    metadata: { name: '', namespace: 'default' },
    spec:     undefined,
  },
};

const createWrapper = (props: any, storeMock = mockStore) => {
  return shallowMount(CruRegistry, {
    props:  { ...defaultProps, ...props },
    global: {
      mocks: {
        $store:  storeMock,
        $route:  mockRoute,
        $router: mockRouter,
        t,
      },
      stubs,
    }
  });
};

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

describe('CruRegistry', () => {
  let wrapper: Wrapper<any>;

  beforeEach(() => {
    mockStore.dispatch.mockClear();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize spec with defaults if it is undefined', () => {
      wrapper = createWrapper({});
      const spec = wrapper.vm.value.spec;

      expect(spec.catalogType).toBe(REGISTRY_TYPE.OCI_DISTRIBUTION);
      expect(spec.scanInterval).toBe(SCAN_INTERVALS.MANUAL);
    });

    it('should default scanInterval to MANUAL if it is null', () => {
      const props = {
        value: {
          metadata: { namespace: 'default' },
          spec:     {
            catalogType:  REGISTRY_TYPE.NO_CATALOG,
            authSecret:   'my-secret',
            uri:          'http://my.registry',
            repositories: ['repo1'],
            scanInterval: null,
          },
        },
      };

      wrapper = createWrapper(props);
      expect(wrapper.vm.value.spec.scanInterval).toBe(SCAN_INTERVALS.MANUAL);
    });
  });

  describe('fetch', () => {
    it('should call dispatch to find secrets on creation', async() => {
      const dispatch = jest.fn().mockResolvedValue(mockSecrets);
      const specificStore = { ...mockStore, dispatch };

      wrapper = createWrapper({}, specificStore);

      if (wrapper.vm.$options.fetch) {
        await wrapper.vm.$options.fetch.call(wrapper.vm);
      }

      await flushPromises();

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SECRET });

      expect(wrapper.vm.allSecrets).toStrictEqual(mockSecrets);
    });
  });

  describe('computed: options (Auth Secrets)', () => {
    beforeEach(async() => {
      wrapper = createWrapper({});
      wrapper.vm.allSecrets = mockSecrets;
      await wrapper.vm.$nextTick();
    });

    it('should return default options if no secrets are loaded', async() => {
      wrapper.vm.allSecrets = null;
      await wrapper.vm.$nextTick();
      const options = wrapper.vm.options;

      expect(options.length).toBe(3);
    });

    it('should filter secrets by namespace (default) and type (docker-json)', () => {
      const options = wrapper.vm.options;

      expect(options.length).toBe(4);
      expect(options[3].label).toBe('secret-1');
    });

    it('should update options when namespace changes', async() => {
      await wrapper.setProps({
        value: {
          ...defaultProps.value,
          metadata: { namespace: 'other' },
          spec:     wrapper.vm.value.spec,
        },
      });
      await wrapper.vm.$nextTick();
      const options = wrapper.vm.options;

      expect(options.length).toBe(4);
      expect(options[3].label).toBe('secret-2');
    });
  });

  describe('computed: validationPassed', () => {
    let validValue: any;

    beforeEach(async() => {
      wrapper = createWrapper({});
      validValue = {
        metadata: { name: 'my-registry', namespace: 'default' },
        spec:     {
          catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
          authSecret:   'my-secret',
          uri:          'http://my.registry',
          repositories: [],
          scanInterval: SCAN_INTERVALS.MANUAL,
        },
      };
      await wrapper.setProps({ value: validValue });
      await wrapper.vm.$nextTick();
    });

    it('should pass validation with valid data', () => {
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('should fail if name is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.metadata.name = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if URI is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.uri = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if authSecret is "create"', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.authSecret = 'create';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if catalogType is NO_CATALOG and repositories is empty', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = [];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass if catalogType is NO_CATALOG and repositories has items', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = ['my-repo'];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(true);
    });
  });

  describe('methods: finish', () => {
    const save = jest.fn();

    beforeEach(() => {
      save.mockReset();
      wrapper = createWrapper({});
      wrapper.vm.save = save;
      wrapper.setProps({
        value: {
          metadata: { name: 'my-registry', namespace: 'default' },
          spec:     {
            catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
            authSecret:   'my-secret',
            uri:          'http://my.registry',
            repositories: [],
            scanInterval: SCAN_INTERVALS.MANUAL,
          },
        },
      });
    });

    it('should delete scanInterval if MANUAL and call save, then route', async() => {
      save.mockResolvedValue({});
      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should NOT delete scanInterval if not MANUAL', async() => {
      save.mockResolvedValue({});
      wrapper.vm.value.spec.scanInterval = SCAN_INTERVALS.DAILY;
      await wrapper.vm.$nextTick();
      await wrapper.vm.finish();
      expect(wrapper.vm.value.spec.scanInterval).toBe(SCAN_INTERVALS.DAILY);
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should set errors and not route on save failure', async() => {
      const error = new Error('Save failed');

      save.mockRejectedValue(error);
      await wrapper.vm.finish();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(wrapper.vm.errors).toEqual([error]);
    });
  });

  describe('methods: refreshList', () => {
    it('should set loading state and re-fetch secrets', async() => {
      const newMockSecret = [{ metadata: { name: 'new-secret', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON }];
      const dispatch = jest.fn().mockResolvedValue(newMockSecret);
      const specificStore = { ...mockStore, dispatch };

      wrapper = createWrapper({}, specificStore);

      if (wrapper.vm.$options.fetch) {
        await wrapper.vm.$options.fetch.call(wrapper.vm);
      }
      await flushPromises();
      dispatch.mockClear();

      expect(wrapper.vm.authLoading).toBe(false);
      const promise = wrapper.vm.refreshList();

      expect(wrapper.vm.authLoading).toBe(true);

      await promise;

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SECRET });
      expect(wrapper.vm.allSecrets).toEqual(newMockSecret);
      expect(wrapper.vm.authLoading).toBe(false);
    });
  });

  describe('Template', () => {
    it('should show info banner when authSecret is "create"', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, authSecret: 'create' } } });
      await wrapper.vm.$nextTick();
      const banner = wrapper.findComponent({ name: 'Banner' });

      expect(banner.exists()).toBe(true);
    });

    it('should NOT show info banner when authSecret is not "create"', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, authSecret: 'my-secret' } } });
      await wrapper.vm.$nextTick();
      const banner = wrapper.findComponent({ name: 'Banner' });

      expect(banner.exists()).toBe(false);
    });

    it('should mark repositories as required when type is NO_CATALOG', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, catalogType: REGISTRY_TYPE.NO_CATALOG } } });
      await wrapper.vm.$nextTick();
      const repoSelect = wrapper.find('[data-testid="registry-scanning-repository-names"]');

      expect(repoSelect.exists()).toBe(true);
      const requiredAttr = repoSelect.attributes('required');

      expect(requiredAttr).toBe('');
    });

    it('should NOT mark repositories as required when type is OCI_DISTRIBUTION', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, catalogType: REGISTRY_TYPE.OCI_DISTRIBUTION } } });
      await wrapper.vm.$nextTick();
      const repoSelect = wrapper.find('[data-testid="registry-scanning-repository-names"]');
      const requiredAttr = repoSelect.attributes('required');

      expect(requiredAttr).toBe(undefined);
    });
  });

  describe('registry scan interval select', () => {
    it('Confirm the key-value pair of constants in the select > options', async() => {
      wrapper = createWrapper({});

      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="1h0m0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="1h0m0s"]').text()).toBe('Every 1 hour');
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="3h0m0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="3h0m0s"]').text()).toBe('Every 3 hours');
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="6h0m0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="6h0m0s"]').text()).toBe('Every 6 hours');
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="12h0m0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="12h0m0s"]').text()).toBe('Every 12 hours');
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="24h0m0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="24h0m0s"]').text()).toBe('Every 24 hours');
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="0s"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-scanning-interval-select"] option[value="0s"]').text()).toBe('Manual Scan');
    });
  });

  describe('registry type select', () => {
    it('should confirm the key-value pairs of REGISTRY_TYPE_OPTIONS in the select > options', () => {
      wrapper = createWrapper({});

      // The LabeledSelect stub renders a select with options
      expect(wrapper.find('select[data-testid="registry-type-select"] option[value="OCIDistribution"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-type-select"] option[value="OCIDistribution"]').text()).toBe('OCI Distribution');

      expect(wrapper.find('select[data-testid="registry-type-select"] option[value="NoCatalog"]').exists()).toBe(true);
      expect(wrapper.find('select[data-testid="registry-type-select"] option[value="NoCatalog"]').text()).toBe('No Catalog');
    });
  });
});
