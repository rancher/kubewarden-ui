import { shallowMount } from '@vue/test-utils';

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

describe('component: Policies Values compare flow', () => {
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
