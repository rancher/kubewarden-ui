import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import { KUBEWARDEN } from '@kubewarden/types';
import NamespaceSelector from '@kubewarden/chart/kubewarden/admission/NamespaceSelector/index.vue';

import KeyValue from '@shell/components/form/KeyValue';
import MatchExpressions from '@shell/components/form/MatchExpressions';

import { userGroupPolicy } from '@tests/unit/_templates_/policyConfig';

describe('component: NamespaceSelector', () => {
  it('matchExpressions should add to the policy namespaceSelector spec', async() => {
    const newMatchExp = {
      key: 'runlevel', operator: 'NotIn', values: ['0', '1']
    };

    const wrapper = shallowMount(NamespaceSelector as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: userGroupPolicy.spec.namespaceSelector },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
    });

    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchExpressions);

    const existingMatchExp = userGroupPolicy.spec.namespaceSelector.matchExpressions;

    await wrapper.setData({ value: { matchExpressions: [...existingMatchExp, newMatchExp] } });

    expect(matchExp.props().value).toStrictEqual(wrapper.props().value.matchExpressions);
  });

  it('matchExpressions should remove matchExpression from policy spec', async() => {
    const wrapper = shallowMount(NamespaceSelector as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: userGroupPolicy.spec.namespaceSelector },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
    });

    const matchExp = wrapper.findComponent(MatchExpressions);

    expect(matchExp.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchExpressions);

    await wrapper.setData({ value: { matchExpressions: [] } });

    expect(matchExp.props().value).toStrictEqual([]);
  });

  it('matchLabels should add and remove label selector to policy spec', async() => {
    const defaultMatchLabel = { key: 'environment', value: 'prod' };
    const wrapper = shallowMount(NamespaceSelector as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: userGroupPolicy.spec.namespaceSelector },
      provide:   { chartType: KUBEWARDEN.CLUSTER_ADMISSION_POLICY },
    });

    const keyValue = wrapper.findComponent(KeyValue);

    expect(keyValue.props().value).toStrictEqual(userGroupPolicy.spec.namespaceSelector.matchLabels);

    await wrapper.setData({ value: { matchLabels: defaultMatchLabel } });

    expect(keyValue.props().value).toStrictEqual(defaultMatchLabel);

    await wrapper.setData({ value: { matchLabels: {} } });

    expect(keyValue.props().value).toStrictEqual({});
  });
});
