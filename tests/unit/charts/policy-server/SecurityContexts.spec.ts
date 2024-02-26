import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import SecurityContexts from '@kubewarden/chart/kubewarden/policy-server/SecurityContexts.vue';
import ContainerConfiguration from '@kubewarden/chart/kubewarden/policy-server/SecurityContexts/ContainerConfiguration.vue';
import PodConfiguration from '@kubewarden/chart/kubewarden/policy-server/SecurityContexts/PodConfiguration.vue';

import { DEFAULT_POLICY_SERVER } from '@kubewarden/models/policies.kubewarden.io.policyserver.js';

describe('component: SecurityContexts', () => {
  it('displays SecurityContexts correctly and should emit the correct event for data update upstream', async() => {
    const extendedDefaultPolicyServer = {
      ...DEFAULT_POLICY_SERVER,
      securityContexts: {
        container: {},
        pod:       {}
      }
    };

    const wrapper = shallowMount(SecurityContexts as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: extendedDefaultPolicyServer },
      mocks:     {
        $fetchState: { pending: false },
        $store:      { getters: { 'i18n/t': jest.fn() } }
      },
    });

    const containerConfiguration = wrapper.findComponent(ContainerConfiguration);
    const podConfiguration = wrapper.findComponent(PodConfiguration);

    expect(containerConfiguration.exists()).toBe(true);
    expect(podConfiguration.exists()).toBe(true);

    const contConfigData = { data: 'some-container-config-data' };
    const podConfigData = { data: 'some-pod-config-data' };

    wrapper.vm.updateContainerConfig(contConfigData);
    wrapper.vm.updatePodConfig(podConfigData);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted()['update-security-contexts']?.length).toBe(2);
    expect(wrapper.emitted()['update-security-contexts']?.[0][0]).toEqual({ type: 'container', data: { ...contConfigData } });
    expect(wrapper.emitted()['update-security-contexts']?.[1][0]).toEqual({ type: 'pod', data: { ...podConfigData } });
  });
});
