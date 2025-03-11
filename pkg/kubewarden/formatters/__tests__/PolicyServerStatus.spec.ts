import { mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';

import { WORKLOAD_TYPES } from '@shell/config/types';
import PolicyServerStatus from '@kubewarden/formatters/PolicyServerStatus.vue';

import mockControllerDeployment from '@tests/unit/mocks/controllerDeployment';

const BadgeStateStub = {
  template: '<div class="badge-state">{{ label }} - {{ color }}</div>',
  props:    ['label', 'color']
};

describe('PolicyServerStatus.vue', () => {
  let store: any;
  let dispatchMock: jest.Mock;

  beforeEach(() => {
    dispatchMock = jest.fn().mockResolvedValue({});
    store = {
      getters: {
        'cluster/canList': () => true,
        'cluster/all':     () => [mockControllerDeployment]
      },
      dispatch: dispatchMock
    };
  });

  const factory = (props = {}) => {
    return mount(PolicyServerStatus, {
      props,
      global: {
        mocks: { $store: store },
        stubs: { BadgeState: BadgeStateStub }
      }
    });
  };

  it('calls store.dispatch in created hook when canList returns true', async() => {
    // Ensure canList returns true so that dispatch is called
    store.getters['cluster/canList'] = () => true;
    factory({ value: 'server1' });
    await flushPromises();

    expect(dispatchMock).toHaveBeenCalledWith('cluster/findAll', { type: WORKLOAD_TYPES.DEPLOYMENT });
  });

  it('does not call store.dispatch in created hook when canList returns false', async() => {
    store.getters['cluster/canList'] = () => false;
    factory({ value: 'server1' });
    await flushPromises();

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('computed allDeployments returns store getter value', async() => {
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    expect(wrapper.vm.allDeployments).toEqual([mockControllerDeployment]);
  });

  it('computed deployment returns matching deployment from allDeployments', async() => {
    const fakeDeployment = {
      spec:     { template: { metadata: { labels: { 'kubewarden/policy-server': 'server1' } } } },
      metadata: { state: { name: 'running' } }
    };

    store.getters['cluster/all'] = () => [fakeDeployment];
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    expect(wrapper.vm.deployment).toEqual(fakeDeployment);
  });

  it('computed stateDisplay returns deployment.metadata.state.name if deployment exists', async() => {
    const fakeDeployment = {
      spec:     { template: { metadata: { labels: { 'kubewarden/policy-server': 'server1' } } } },
      metadata: { state: { name: 'running' } }
    };

    store.getters['cluster/all'] = () => [fakeDeployment];
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    expect(wrapper.vm.stateDisplay).toBe('running');
  });

  it('computed stateDisplay returns "pending" if no deployment exists', async() => {
    store.getters['cluster/all'] = () => [];
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    expect(wrapper.vm.stateDisplay).toBe('pending');
  });

  it('computed stateBackground returns "bg-" concatenated with colorForPolicyServerState(stateDisplay)', async() => {
    // Stub colorForPolicyServerState so that regardless of input it returns "info"
    const spy = jest.spyOn(require('@kubewarden/plugins/kubewarden-class'), 'colorForPolicyServerState')
      .mockImplementation(() => 'info');

    // Provide a deployment so that stateDisplay is not "pending"
    const fakeDeployment = {
      spec:     { template: { metadata: { labels: { 'kubewarden/policy-server': 'server1' } } } },
      metadata: { state: { name: 'running' } }
    };

    store.getters['cluster/all'] = () => [fakeDeployment];
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    expect(wrapper.vm.stateBackground).toBe('bg-info');
    spy.mockRestore();
  });

  it('capitalizeMessage method capitalizes a given string', () => {
    const wrapper = factory({ value: 'server1' });

    expect(wrapper.vm.capitalizeMessage('pending')).toBe('Pending');
    expect(wrapper.vm.capitalizeMessage('error')).toBe('Error');
  });

  it('renders BadgeState component with correct props', async() => {
    // Use a fake deployment so that stateDisplay is not "pending"
    const fakeDeployment = {
      spec:     { template: { metadata: { labels: { 'kubewarden/policy-server': 'server1' } } } },
      metadata: { state: { name: 'running' } }
    };

    store.getters['cluster/all'] = () => [fakeDeployment];
    const wrapper = factory({ value: 'server1' });

    await flushPromises();

    // BadgeState should be rendered because stateDisplay is truthy
    const badgeState = wrapper.find('.badge-state');

    expect(badgeState.exists()).toBe(true);
    // capitalizeMessage('running') should yield "Running"
    expect(badgeState.text()).toContain('Running');
    // Also, the color prop is rendered as part of the text (stub displays " - {color}")
    expect(badgeState.text()).toContain('bg-');
  });
});
