import { shallowMount } from '@vue/test-utils';


import Verification from '@kubewarden/chart/kubewarden/policy-server/Verification.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

interface ConfigMap {
  id: string
}

const configMaps: ConfigMap[] = [
  { id: 'cm-1' },
  { id: 'cm-2' },
  { id: 'cm-3' },
];

describe('component: Verification', () => {
  it('displays configmap options', () => {
    const wrapper = shallowMount(Verification, {
      props:  {
        value: DEFAULT_POLICY_SERVER,
        configMaps
      },
      global: { stubs: { Banner: { template: '<span />' } } }
    });

    const selector = wrapper.findComponent(LabeledSelect);

    expect(selector.props().options).toStrictEqual(['cm-1', 'cm-2', 'cm-3'] as string[]);
  });

  it('displays correct configmap when existing', () => {
    const configMaps = ['cm-1', 'cm-2', 'cm-3'];

    const wrapper = shallowMount(Verification, {
      props:  {
        value: { verificationConfig: configMaps[1] },
        configMaps
      },
      global: { stubs: { Banner: { template: '<span />' } } }
    });

    const selector = wrapper.findComponent(LabeledSelect);

    expect(selector.props().value).toStrictEqual(configMaps[1] as string);
  });
});
