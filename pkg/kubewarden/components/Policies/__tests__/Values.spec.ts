import { mount, shallowMount } from '@vue/test-utils';

import { VALUES_STATE } from '@kubewarden/types';
import Values from '@kubewarden/components/Policies/Values.vue';

const mockStore = {
  getters: {
    'catalog/version': () => null,
    'cluster/all':     () => [],
    'i18n/t':          (key: string) => key,
  }
};

jest.mock('vuex', () => ({ useStore: () => mockStore }));

function createChartValues(module = 'ghcr.io/kubewarden/policies/cap-hostname:v1.0.0') {
  return {
    policy: {
      apiVersion: 'policies.kubewarden.io/v1',
      kind:       'AdmissionPolicy',
      metadata:   {
        name:      'my-policy',
        namespace: 'default'
      },
      spec: { module }
    }
  };
}

function createWrapper() {
  const chartValues = createChartValues();

  return shallowMount(Values, {
    props: {
      mode:                'create',
      chartValues,
      customPolicy:        false,
      value:               {
        type:            'policies.kubewarden.io.admissionpolicy',
        haveComponent:   () => false,
        importComponent: () => null,
      },
      yamlValues:          '',
      errorFetchingPolicy: false,
      moduleInfo:          null,
    },
    global: {
      stubs: {
        ButtonGroup:         { template: '<div />' },
        Loading:             { template: '<div />' },
        ResourceCancelModal: { template: '<div />' },
        Tabbed:              { template: '<div><slot /></div>' },
        YamlEditor:          { template: '<div />' },
      }
    }
  });
}

function createClusterAdmissionPolicyValues() {
  return {
    policy: {
      apiVersion: 'policies.kubewarden.io/v1',
      kind:       'ClusterAdmissionPolicy',
      metadata:   { name: 'cap-policy' },
      spec:       {
        backgroundAudit: true,
        policyServer:    '',
        mode:            'monitor',
        module:          'ghcr.io/kubewarden/policies/psa-label-enforcer:v1.0.11',
        rules:           [{
          apiGroups:   [''],
          apiVersions: ['v1'],
          resources:   ['pods'],
          operations:  ['CREATE', 'UPDATE']
        }],
        matchConditions:   [],
        mutating:          true,
        namespaceSelector: {
          matchExpressions: [],
          matchLabels:      {}
        },
        settings: {}
      }
    }
  };
}

function createClusterAdmissionPolicyYaml() {
  return [
    'apiVersion: policies.kubewarden.io/v1',
    'kind: ClusterAdmissionPolicy',
    'metadata:',
    '  name: cap-policy',
    'spec:',
    '  backgroundAudit: true',
    "  policyServer: ''",
    '  mode: monitor',
    '  module: ghcr.io/kubewarden/policies/psa-label-enforcer:v1.0.11',
    '  rules:',
    '    - apiGroups:',
    "        - ''",
    '      apiVersions:',
    '        - v1',
    '      resources:',
    '        - pods',
    '      operations:',
    '        - CREATE',
    '        - UPDATE',
    '  matchConditions: []',
    '  mutating: true',
    '  namespaceSelector:',
    '    matchExpressions: []',
    '    matchLabels: {}',
    '  settings: {}',
    ''
  ].join('\n');
}

describe('component: Policies Values compare flow', () => {
  it('captures current YAML value right after mount (integration)', async() => {
    // Disclaimer: this integration assertion is required because the current architecture
    // keeps YAML state across composable + lifecycle wiring, which is difficult to validate
    // reliably with isolated unit-level assertions alone.
    const chartValues = createChartValues('ghcr.io/kubewarden/policies/cap-hostname:v9.9.9');
    const wrapper = mount(Values, {
      props: {
        mode:                'create',
        chartValues,
        customPolicy:        false,
        value:               {
          type:            'policies.kubewarden.io.admissionpolicy',
          haveComponent:   () => false,
          importComponent: () => null,
        },
        yamlValues:          '',
        errorFetchingPolicy: false,
        moduleInfo:          null,
      },
      global: {
        stubs: {
          ButtonGroup:         { template: '<div />' },
          Loading:             { template: '<div />' },
          ResourceCancelModal: { template: '<div />' },
          Tabbed:              { template: '<div><slot /></div>' },
          YamlEditor:          { template: '<div />' },
        }
      }
    });

    await wrapper.vm.$nextTick();

    const currentYaml = (wrapper.vm as any).currentYamlValues;

    expect(currentYaml).toContain('apiVersion: policies.kubewarden.io/v1');
    expect(currentYaml).toContain('kind: AdmissionPolicy');
    expect(currentYaml).toContain('module: ghcr.io/kubewarden/policies/cap-hostname:v9.9.9');
    expect((wrapper.vm as any).currentYamlValues).toBe((wrapper.vm as any).originalYamlValues);
  });

  it('does not mark compare as changed for form-injected CAP defaults after mount', async() => {
    // Disclaimer: this integration assertion is required because the current architecture
    // applies defaults during mount/watch cycles, and we must guarantee those internal
    // defaults do not appear as user-authored compare changes.
    const wrapper = mount(Values, {
      props: {
        mode:                'create',
        chartValues:          createClusterAdmissionPolicyValues(),
        customPolicy:        false,
        value:               {
          type:            'policies.kubewarden.io.clusteradmissionpolicy',
          haveComponent:   () => false,
          importComponent: () => null,
        },
        yamlValues:          createClusterAdmissionPolicyYaml(),
        errorFetchingPolicy: false,
        moduleInfo:          null,
      },
      global: {
        stubs: {
          ButtonGroup:         { template: '<div />' },
          Loading:             { template: '<div />' },
          ResourceCancelModal: { template: '<div />' },
          Tabbed:              { template: '<div><slot /></div>' },
          YamlEditor:          { template: '<div />' },
        }
      }
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).canDiff).toBe(false);
    expect((wrapper.vm as any).originalYamlValues).toContain('kubernetes.io/metadata.name');
  });

  it('starts with compare disabled when nothing changed', async() => {
    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).canDiff).toBe(false);
  });

  it('updates compare availability when form values change', async() => {
    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    await wrapper.setProps({ chartValues: createChartValues('ghcr.io/kubewarden/policies/cap-hostname:v2.0.0') });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).canDiff).toBe(true);
  });

  it('uses latest form snapshot when switching directly to compare', async() => {
    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    await wrapper.setProps({ chartValues: createChartValues('ghcr.io/kubewarden/policies/cap-hostname:v3.0.0') });
    await wrapper.vm.$nextTick();

    (wrapper.vm as any).preYamlOption = VALUES_STATE.DIFF;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).yamlOption).toBe(VALUES_STATE.DIFF);
    expect((wrapper.vm as any).currentYamlValues).toContain('v3.0.0');
  });
});
