import { shallowMount } from '@vue/test-utils';

import { KUBEWARDEN } from '@kubewarden/types';
import { VALUES_STATE } from '@kubewarden/types';
import Create from '@kubewarden/components/Policies/Create.vue';

// A minimal VersionInfo-like object whose parsePolicyModule() returns known values
const mockVersionInfo = {
  chart:  { annotations: { 'kubewarden/registry': 'ghcr.io', 'kubewarden/repository': 'kubewarden/policies/cap-hostname', 'kubewarden/tag': 'v1.0.0' } },
  values: {
    module: {
      repository: 'kubewarden/policies/cap-hostname',
      tag:        'v1.0.0',
    },
  },
};

const mockStoreGetters = {
  currentStore:                     () => 'cluster',
  'cluster/schemaFor':              () => null,
  'cluster/canList':                () => false,
  'type-map/isSpoofed':             () => false,
  'catalog/repos':                  [],
  'catalog/charts':                 [],
  'management/byId':                () => null,
  'kubewarden/airGapped':           false,
  'kubewarden/hideBannerOfficialRepo': true,
  'kubewarden/hideBannerPolicyRepo':   true,
  'kubewarden/hideBannerAirgapPolicy': true,
  'i18n/t':                         (key: string) => key,
};

const mockStore = {
  getters:  mockStoreGetters,
  dispatch: jest.fn(),
};

function createWrapper(overrides: any = {}) {
  return shallowMount(Create, {
    props: {
      value: {
        metadata: { annotations: {} },
        spec:     {},
      },
      mode: 'create',
    },
    global: {
      provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY, realMode: 'create' },
      mocks:   {
        $store:      mockStore,
        $fetchState: { pending: false },
        $route:      { params: {}, query: {}, hash: '' },
        $router:     { replace: jest.fn() },
      },
      stubs: {
        Loading:           { template: '<span />' },
        Wizard:            { template: '<span />' },
        PolicyTable:       { template: '<span />' },
        PolicyReadmePanel: { template: '<span />' },
        Values:            { template: '<span />' },
        Banner:            { template: '<span />' },
        AsyncButton:       { template: '<span />' },
      },
    },
    ...overrides,
  });
}

describe('component: Create', () => {
  describe('resolvePolicyModuleInfo()', () => {
    it('sets policyModuleInfo with chart defaults when module matches suffix exactly', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      (wrapper.vm as any).chartValues = { policy: { spec: { module: 'kubewarden/policies/cap-hostname:v1.0.0' } } };

      (wrapper.vm as any).resolvePolicyModuleInfo();

      expect((wrapper.vm as any).policyModuleInfo).toMatchObject({
        registry:   '',
        repository: 'kubewarden/policies/cap-hostname',
        tag:        'v1.0.0',
      });
    });

    it('extracts custom registry when module has a registry prefix matching the suffix', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      (wrapper.vm as any).chartValues = { policy: { spec: { module: 'myregistry.io/kubewarden/policies/cap-hostname:v1.0.0' } } };

      (wrapper.vm as any).resolvePolicyModuleInfo();

      expect((wrapper.vm as any).policyModuleInfo).toMatchObject({
        registry:   'myregistry.io',
        repository: 'kubewarden/policies/cap-hostname',
        tag:        'v1.0.0',
      });
    });

    it('extracts registry without dots (e.g. "11111") when repo/tag were also changed', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      // Registry "11111" has no dot — anchor suffix no longer matches, so falls back to split logic
      (wrapper.vm as any).chartValues = { policy: { spec: { module: '11111/22222:333333' } } };

      (wrapper.vm as any).resolvePolicyModuleInfo();

      expect((wrapper.vm as any).policyModuleInfo).toMatchObject({
        registry:   '11111',
        repository: '22222',
        tag:        '333333',
      });
    });

    it('does nothing when selectedPolicyDetails is null', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = null;
      (wrapper.vm as any).policyModuleInfo = null;

      (wrapper.vm as any).resolvePolicyModuleInfo();

      expect((wrapper.vm as any).policyModuleInfo).toBeNull();
    });
  });

  describe('yamlOption watcher (YAML → FORM)', () => {
    it('syncs spec.module from yamlValues and re-resolves policyModuleInfo', async() => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      (wrapper.vm as any).chartValues = { policy: { spec: { module: 'kubewarden/policies/cap-hostname:v1.0.0' } } };
      (wrapper.vm as any).yamlValues = 'spec:\n  module: 11111/22222:333333\n';

      // Simulate transition from YAML → FORM
      (wrapper.vm as any).yamlOption = VALUES_STATE.YAML;
      await wrapper.vm.$nextTick();

      (wrapper.vm as any).yamlOption = VALUES_STATE.FORM;
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).chartValues.policy.spec.module).toBe('11111/22222:333333');
      expect((wrapper.vm as any).policyModuleInfo).toMatchObject({
        registry:   '11111',
        repository: '22222',
        tag:        '333333',
      });
    });

    it('does not run when transitioning FORM → YAML', async() => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      (wrapper.vm as any).policyModuleInfo = { registry: 'original', repository: 'repo', tag: 'tag', source: 'values' };
      (wrapper.vm as any).chartValues = { policy: { spec: { module: 'repo:tag' } } };
      (wrapper.vm as any).yamlValues = 'spec:\n  module: other/repo:newtag\n';

      (wrapper.vm as any).yamlOption = VALUES_STATE.YAML;
      await wrapper.vm.$nextTick();

      // policyModuleInfo should be unchanged
      expect((wrapper.vm as any).policyModuleInfo.registry).toBe('original');
    });

    it('does not run when customPolicy is true', async() => {
      const wrapper = createWrapper();

      (wrapper.vm as any).selectedPolicyDetails = mockVersionInfo;
      (wrapper.vm as any).selectedPolicyChart = 'custom'; // makes customPolicy computed = true
      (wrapper.vm as any).policyModuleInfo = { registry: 'original', repository: 'repo', tag: 'tag', source: 'values' };
      (wrapper.vm as any).chartValues = { policy: { spec: { module: 'repo:tag' } } };
      (wrapper.vm as any).yamlValues = 'spec:\n  module: 11111/22222:333333\n';

      (wrapper.vm as any).yamlOption = VALUES_STATE.YAML;
      await wrapper.vm.$nextTick();

      (wrapper.vm as any).yamlOption = VALUES_STATE.FORM;
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).policyModuleInfo.registry).toBe('original');
    });
  });
});
