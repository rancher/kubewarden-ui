import { shallowMount } from '@vue/test-utils';


import { KUBEWARDEN } from '@kubewarden/types';
import NamespaceSelector from '@kubewarden/chart/kubewarden/admission/NamespaceSelector/index.vue';

import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';

import { userGroupPolicy } from '@tests/unit/mocks/policyConfig';

describe('component: NamespaceSelector', () => {
  it('matchExpressions should add to the policy namespaceSelector spec', async() => {
    const newMatchExp = {
      key:      'runlevel',
      operator: 'NotIn',
      values:   ['0', '1']
    };

    const wrapper = shallowMount(NamespaceSelector, {
      props:  { value: userGroupPolicy.spec.namespaceSelector },
      global: {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        stubs:   { InfoBox: { template: '<div><slot /></div>' } }
      }
    });

    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchExpressions);

    const existingMatchExp = userGroupPolicy.spec.namespaceSelector.matchExpressions;

    await wrapper.setData({ value: { matchExpressions: [...existingMatchExp, newMatchExp] } });

    expect(matchExp.props().value).toStrictEqual(wrapper.props()?.value?.matchExpressions);
  });

  it('matchExpressions should remove matchExpression from policy spec', async() => {
    const wrapper = shallowMount(NamespaceSelector, {
      props:  { value: userGroupPolicy.spec.namespaceSelector },
      global: {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        stubs:   { InfoBox: { template: '<div><slot /></div>' } }
      }
    });

    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchExpressions);

    // Simulate the child component emitting an update with an empty array (i.e. removing match expressions)
    matchExp.vm.$emit('update:value', []);
    await wrapper.vm.$nextTick();

    // Test that the internal data is updated
    expect(wrapper.vm.matchExpressions).toStrictEqual([]);

    // Get the emitted events and cast them to the expected type.
    const updateEvents = wrapper.emitted('update:value') as Array<Array<any>>; // cast to array of arrays of unknown
    const eventPayload = updateEvents[0][0] as { matchExpressions: string[]; matchLabels: { [key: string]: string } };

    expect(eventPayload.matchExpressions).toStrictEqual([]);
  });

  it('matchLabels should add and remove label selector to policy spec', async() => {
    const defaultMatchLabel = {
      key:   'environment',
      value: 'prod'
    };
    const wrapper = shallowMount(NamespaceSelector, {
      props:  { value: userGroupPolicy.spec.namespaceSelector },
      global: {
        provide: { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
        stubs:   { InfoBox: { template: '<div><slot /></div>' } }
      }
    });

    const keyValue = wrapper.findComponent(KeyValue);

    expect(keyValue.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchLabels);

    await keyValue.vm.$emit('update:value', defaultMatchLabel);
    await wrapper.vm.$nextTick();

    expect(keyValue.props().value).toStrictEqual(defaultMatchLabel);

    await keyValue.vm.$emit('update:value', {});
    await wrapper.vm.$nextTick();

    expect(keyValue.props().value).toStrictEqual({});
  });
});
