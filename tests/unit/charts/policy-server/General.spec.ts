import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import General from '@kubewarden/chart/kubewarden/policy-server/General.vue';
import ServiceNameSelect from '@shell/components/form/ServiceNameSelect';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

describe('component: General', () => {
  it('displays service account options', () => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: DEFAULT_POLICY_SERVER, serviceAccounts },
      stubs:     {
        LabeledInput:      { template: '<span />' },
        RadioGroup:        { template: '<span />' }
      }
    });

    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props().options).toStrictEqual(serviceAccounts as String[]);
  });

  it('displays correct service account when existing', () => {
    const serviceAccounts = ['sa-1', 'sa-2', 'sa-3'];

    const name = { spec: { serviceAccountName: serviceAccounts[1] } };
    const policyServer = { ...DEFAULT_POLICY_SERVER, ...name };

    const wrapper = shallowMount(General as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: policyServer, serviceAccounts },
      stubs:     { Banner: { template: '<span />' } }
    });

    const selector = wrapper.findComponent(ServiceNameSelect);

    expect(selector.props().value).toStrictEqual(serviceAccounts[1] as String);
  });
});
