import { shallowMount } from '@vue/test-utils';


import ContainerConfiguration from '@kubewarden/chart/kubewarden/policy-server/SecurityContexts/ContainerConfiguration.vue';

import SeLinuxOptions from '@kubewarden/components/PolicyServer/SeLinuxOptions.vue';
import SeccompProfile from '@kubewarden/components/PolicyServer/SeccompProfile.vue';
import Capabilities from '@kubewarden/components/PolicyServer/Capabilities.vue';
import WindowsOptions from '@kubewarden/components/PolicyServer/WindowsOptions.vue';

describe('component: ContainerConfiguration', () => {
  it('displays ContainerConfiguration correctly and should emit the correct events for data update upstream', async() => {
    const containerConfigData = {
      allowPrivilegeEscalation: false,
      capabilities:             {},
      privileged:               false,
      procMount:                '',
      readOnlyRootFilesystem:   false,
      runAsGroup:               0,
      runAsNonRoot:             false,
      runAsUser:                0,
      seLinuxOptions:           {},
      seccompProfile:           {},
      windowsOptions:           {},
    };

    const wrapper = shallowMount(ContainerConfiguration, {
      props:  { value: containerConfigData },
      global: {
        mocks:     {
          $fetchState: { pending: false },
          $store:      { getters: { 'i18n/t': jest.fn() } }
        },
      }
    });

    const allowPrivilegeEscalation = wrapper.find('[data-testid="ps-config-security-context-container-allow-priv-escalation-input"]');
    const capabilities = wrapper.findComponent(Capabilities);
    const privileged = wrapper.find('[data-testid="ps-config-security-context-container-privileged-input"]');
    const procMount = wrapper.find('[data-testid="ps-config-security-context-container-procMount-input"]');
    const readOnlyRootFilesystem = wrapper.find('[data-testid="ps-config-security-context-container-readOnlyRootFilesystem-input"]');
    const runAsGroup = wrapper.find('[data-testid="ps-config-security-context-container-runAsGroup-input"]');
    const runAsNonRoot = wrapper.find('[data-testid="ps-config-security-context-container-runAsNonRoot-input"]');
    const runAsUser = wrapper.find('[data-testid="ps-config-security-context-container-runAsUser-input"]');
    const seLinuxOptions = wrapper.findComponent(SeLinuxOptions);
    const seccompProfile = wrapper.findComponent(SeccompProfile);
    const windowsOptions = wrapper.findComponent(WindowsOptions);

    expect(allowPrivilegeEscalation.exists()).toBe(true);
    expect(capabilities.exists()).toBe(true);
    expect(privileged.exists()).toBe(true);
    expect(procMount.exists()).toBe(true);
    expect(readOnlyRootFilesystem.exists()).toBe(true);
    expect(runAsGroup.exists()).toBe(true);
    expect(runAsNonRoot.exists()).toBe(true);
    expect(runAsUser.exists()).toBe(true);
    expect(seLinuxOptions.exists()).toBe(true);
    expect(seccompProfile.exists()).toBe(true);
    expect(windowsOptions.exists()).toBe(true);

    wrapper.vm.updateData('1', 'runAsUser');
    wrapper.vm.updateData({ prop: 'some-prop' }, 'capabilities');
    await wrapper.vm.$nextTick();

    const emittedEvents = wrapper.emitted('update-container-config') as Array<Array<any>>; // cast to array of arrays of unknown

    expect(emittedEvents?.length).toBe(2);
    expect(emittedEvents?.[0][0]).toEqual(expect.objectContaining({ runAsUser: 1 }));
    expect(emittedEvents?.[1][0]).toEqual(expect.objectContaining({ capabilities: { prop: 'some-prop' } }));
  });
});
