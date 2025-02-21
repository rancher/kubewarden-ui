import { shallowMount } from '@vue/test-utils';


import PodConfiguration from '@kubewarden/chart/kubewarden/policy-server/SecurityContexts/PodConfiguration.vue';

import SeLinuxOptions from '@kubewarden/components/PolicyServer/SeLinuxOptions.vue';
import SeccompProfile from '@kubewarden/components/PolicyServer/SeccompProfile.vue';
import WindowsOptions from '@kubewarden/components/PolicyServer/WindowsOptions.vue';
import ArrayListInteger from '@kubewarden/components/ArrayListInteger.vue';
import SysctlsArrayList from '@kubewarden/components/PolicyServer/SysctlsArrayList.vue';

describe('component: PodConfiguration', () => {
  it('displays PodConfiguration correctly and should emit the correct events for data update upstream', async() => {
    const containerConfigData = {
      fsGroup:             0,
      fsGroupChangePolicy: '',
      runAsNonRoot:        false,
      runAsGroup:          0,
      runAsUser:           0,
      seLinuxOptions:      {},
      seccompProfile:      {},
      supplementalGroups:  [],
      sysctls:             [],
      windowsOptions:      {},
    };

    const wrapper = shallowMount(PodConfiguration, {
      props:  { value: containerConfigData },
      global: {
        mocks:     {
          $fetchState: { pending: false },
          $store:      { getters: { 'i18n/t': jest.fn() } }
        },
      }
    });

    const fsGroup = wrapper.find('[data-testid="ps-config-security-context-pod-fsGroup-input"]');
    const fsGroupChangePolicy = wrapper.find('[data-testid="ps-config-security-context-pod-fsGroupChangePolicy-input"]');
    const runAsNonRoot = wrapper.find('[data-testid="ps-config-security-context-pod-runAsNonRoot-input"]');
    const runAsGroup = wrapper.find('[data-testid="ps-config-security-context-pod-runAsGroup-input"]');
    const runAsUser = wrapper.find('[data-testid="ps-config-security-context-pod-runAsUser-input"]');
    const seLinuxOptions = wrapper.findComponent(SeLinuxOptions);
    const seccompProfile = wrapper.findComponent(SeccompProfile);
    const supplementalGroups = wrapper.findComponent(ArrayListInteger);
    const sysctls = wrapper.findComponent(SysctlsArrayList);
    const windowsOptions = wrapper.findComponent(WindowsOptions);

    expect(fsGroup.exists()).toBe(true);
    expect(fsGroupChangePolicy.exists()).toBe(true);
    expect(runAsNonRoot.exists()).toBe(true);
    expect(runAsGroup.exists()).toBe(true);
    expect(runAsUser.exists()).toBe(true);
    expect(seLinuxOptions.exists()).toBe(true);
    expect(seccompProfile.exists()).toBe(true);
    expect(supplementalGroups.exists()).toBe(true);
    expect(sysctls.exists()).toBe(true);
    expect(windowsOptions.exists()).toBe(true);

    wrapper.vm.updateData('1', 'runAsUser');
    wrapper.vm.updateData({ prop: 'some-prop' }, 'capabilities');
    await wrapper.vm.$nextTick();

    const emittedEvents = wrapper.emitted('update-pod-config') as Array<Array<any>>;

    expect(emittedEvents?.length).toBe(2);
    expect(emittedEvents?.[0][0]).toEqual(expect.objectContaining({ runAsUser: 1 }));
    expect(emittedEvents?.[1][0]).toEqual(expect.objectContaining({ capabilities: { prop: 'some-prop' } }));
  });
});
