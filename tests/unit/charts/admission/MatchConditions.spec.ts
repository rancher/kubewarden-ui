import { describe, expect, it, jest } from '@jest/globals';
import { shallowMount } from '@vue/test-utils';

import MatchConditions from '@kubewarden/chart/kubewarden/admission/MatchConditions.vue';

jest.mock('@shell/components/CodeMirror', () => ({ template: '<div class="code-mirror"></div>' }));

const createWrapper = (propsData = {}, mocks = {}) => {
  return shallowMount(MatchConditions, {
    propsData,
    mocks,
    stubs: {
      CodeMirror:   true,
      InfoBox:      true,
      LabeledInput: true,
    },
  });
};

const testCondition1 = { name: 'exclude-leases', expression: '!(request.resource.group == "coordination.k8s.io" && request.resource.resource == "leases")' };
const testCondition2 = { name: 'rbac', expression: 'request.resource.group != "rbac.authorization.k8s.io"' };

describe('MatchConditions.vue', () => {
  it('renders the correct number of conditions based on the initial value', () => {
    const value = { policy: { spec: { matchConditions: [testCondition1, testCondition2] } } };
    const wrapper = createWrapper({ value });

    expect(wrapper.findAll('.condition').length).toBe(2);
  });

  it('adds a new condition when addCondition is called', async() => {
    const value = { policy: { spec: { matchConditions: [] } } };
    const wrapper = createWrapper({ value });

    wrapper.vm.addCondition();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.matchConditions.length).toBe(1);
    expect(wrapper.findAll('.condition').length).toBe(1);
  });

  it('removes a condition when removeCondition is called', async() => {
    const value = { policy: { spec: { matchConditions: [testCondition1, testCondition2] } } };
    const wrapper = createWrapper({ value });

    wrapper.vm.removeCondition(0);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.matchConditions.length).toBe(1);
    expect(wrapper.findAll('.condition').length).toBe(1);
  });

  it('handles input correctly when handleInput is called', async() => {
    const newExp = '!("system:nodes" in request.userInfo.groups)';
    const value = { policy: { spec: { matchConditions: [testCondition1, testCondition2] } } };
    const wrapper = createWrapper({ value });

    wrapper.vm.handleInput(newExp, 0);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.matchConditions[0].expression).toBe(newExp);
  });

  it('refreshes CodeMirror instances when activeTab is set to matchConditions', async() => {
    const value = { policy: { spec: { matchConditions: [testCondition1, testCondition2] } } };
    const wrapper = createWrapper({ value });

    wrapper.vm.$refs['cm-0'] = [{ refresh: jest.fn() }];
    wrapper.setProps({ activeTab: 'matchConditions' });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.$refs['cm-0'][0].refresh).toHaveBeenCalled();
  });
});
