import { createWrapper } from '@tests/unit/_utils_/wrapper';
import { policyPackages } from '@tests/unit/_templates_/policyPackages';

import ChartReadme from '@shell/components/ChartReadme';
import PolicyReadmePanel from '@kubewarden/components/Policies/PolicyReadmePanel.vue';

const commons = {
  propsData: { packageValues: {} },
  computed:  { applyDarkModeBg: () => jest.fn() },
  mocks:     {
    $fetchState: { pending: false },
    $store:      { getters: { 'prefs/theme': () => 'light' } },
  },
};

const createPolicyReadmePanelWrapper = createWrapper(PolicyReadmePanel, commons);

describe('PolicyDetail.vue', () => {
  it('renders correctly when showSlideIn is true', () => {
    const wrapper = createPolicyReadmePanelWrapper({
      propsData: { packageValues: policyPackages[0] },
      data() {
        return { showSlideIn: true };
      }
    });

    expect(wrapper.find('.glass').exists()).toBe(true);
    expect(wrapper.find('.slideIn').classes()).toContain('slideIn__show');
  });

  it('renders correctly when showSlideIn is false', () => {
    const wrapper = createPolicyReadmePanelWrapper({ propsData: { packageValues: policyPackages[0] } });

    expect(wrapper.find('.glass').exists()).toBe(false);
    expect(wrapper.find('.slideIn').classes()).not.toContain('slideIn__show');
  });

  it('toggles showSlideIn when show and hide methods are called', async() => {
    const wrapper = createPolicyReadmePanelWrapper({ propsData: { packageValues: policyPackages[0] } });

    wrapper.vm.show();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.showSlideIn).toBe(true);

    wrapper.vm.hide();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.showSlideIn).toBe(false);
  });

  it('renders ChartReadme component with correct props', () => {
    const wrapper = createPolicyReadmePanelWrapper({ propsData: { packageValues: policyPackages[0] } });

    const chartReadme = wrapper.findComponent(ChartReadme);

    expect(chartReadme.exists()).toBe(true);
    expect(chartReadme.props().versionInfo).toStrictEqual(policyPackages[0]);
  });
});