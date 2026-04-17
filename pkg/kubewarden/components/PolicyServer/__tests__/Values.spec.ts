import { shallowMount } from '@vue/test-utils';

import { VALUES_STATE } from '@kubewarden/types';
import Values from '@kubewarden/components/PolicyServer/Values.vue';

jest.mock('@shell/utils/create-yaml', () => ({
  createYaml: (_schemas: any, _type: string, values: any) => {
    return `image:\n  repository: ${ values?.image?.repository || '' }\n  tag: ${ values?.image?.tag || '' }\n`;
  }
}));

function createChartValues(tag = 'v1.0.0') {
  return {
    image: {
      repository: 'ghcr.io/kubewarden/policy-server',
      tag,
    }
  };
}

function createWrapper(chartValues = createChartValues()) {
  return shallowMount(Values, {
    props: {
      mode:  'create',
      chartValues,
      value: {
        type:            'policies.kubewarden.io.policyserver',
        haveComponent:   () => false,
        importComponent: () => null,
      }
    },
    global: {
      mocks: {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            'cluster/all': () => [],
            'i18n/t':      (key: string) => key,
          }
        }
      },
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

describe('component: PolicyServer Values compare flow', () => {
  it('updates compare availability when form values change', async() => {
    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).canDiff).toBe(false);

    await wrapper.setProps({ chartValues: createChartValues('v2.0.0') });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).canDiff).toBe(true);
  });

  it('switches to diff mode and uses latest form snapshot', async() => {
    const wrapper = createWrapper();

    await wrapper.setProps({ chartValues: createChartValues('v3.1.0') });
    await wrapper.vm.$nextTick();

    (wrapper.vm as any).preYamlOption = VALUES_STATE.DIFF;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).yamlOption).toBe(VALUES_STATE.DIFF);
    expect((wrapper.vm as any).currentYamlValues).toContain('v3.1.0');
  });
});
