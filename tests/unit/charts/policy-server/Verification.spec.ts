import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Verification from '@kubewarden/chart/kubewarden/policy-server/Verification.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

describe('component: Verification', () => {
  it('displays configmap options', () => {
    const configMaps = ['cm-1', 'cm-2', 'cm-3'];

    const wrapper = shallowMount(Verification as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, configMaps },
      stubs:     { Banner: { template: '<span />' } }
    });

    const selector = wrapper.findComponent(LabeledSelect);

    expect(selector.props().options).toStrictEqual(configMaps as Array<String>);
  });

  it('displays correct configmap when existing', () => {
    const configMaps = ['cm-1', 'cm-2', 'cm-3'];

    const wrapper = shallowMount(Verification as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: { verificationConfig: configMaps[1] }, configMaps },
      stubs:     { Banner: { template: '<span />' } }
    });

    const selector = wrapper.findComponent(LabeledSelect);

    expect(selector.props().value).toStrictEqual(configMaps[1] as String);
  });
});
