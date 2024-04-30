import { createWrapper } from '@tests/unit/_utils_/wrapper';

import ResourceTab from '@kubewarden/components/PolicyReporter/ResourceTab.vue';
import { mockPolicyReport, mockClusterPolicyReport } from '../../_templates_/policyReports';

const commons = {
  mocks: {
    $store: {
      getters: {
        currentCluster:               () => ({ id: 'test-cluster' }),
        'resource-fetch/refreshFlag': () => jest.fn(),
        'management/byId':            () => jest.fn(),
        'i18n/t':                     () => jest.fn(),
        'cluster/schemaFor':          () => jest.fn()
      },
    },
    $fetchState: { pending: false }
  },
};

const wrapperFactory = createWrapper(ResourceTab, commons);

describe('ResourceTab.vue', () => {
  it('computes canGetKubewardenLinks correctly', () => {
    const wrapper = wrapperFactory({ propsData: { resource: {} } });

    expect(wrapper.vm.canGetKubewardenLinks).toBeTruthy(); // or .toBeFalsy(), based on your logic
  });

  it('renders reports for namespace resources', async() => {
    const wrapper = wrapperFactory({ propsData: { resource: { type: 'namespace', metadata: { name: 'default' } } } });

    await wrapper.vm.$nextTick();
    wrapper.setData({ reports: [mockPolicyReport, mockClusterPolicyReport] });

    await wrapper.vm.$nextTick();

    expect(wrapper.find('.pr-tab__container').exists()).toBe(true);
    expect(wrapper.findAll('sortabletable-stub').length).toBe(1);
    expect(wrapper.vm.isNamespaceResource).toBeTruthy();
  });

  it('hasNamespace returns false when namespace is absent', async() => {
    const wrapper = wrapperFactory({ propsData: { resource: { metadata: {} } } });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.hasNamespace).toBeFalsy();
  });

  it('hasReports returns true when reports are present', async() => {
    const wrapper = wrapperFactory({ propsData: { resource: { metadata: {} } } });

    await wrapper.vm.$nextTick();
    wrapper.setData({
      reports: [{
        id: '1', result: 'fail', severity: 'critical'
      }]
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.hasReports).toBeTruthy();
  });

  it('hasReports returns false when reports are empty', async() => {
    const wrapper = wrapperFactory({ propsData: { resource: {} } });

    await wrapper.vm.$nextTick();
    wrapper.setData({ reports: [] });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.hasReports).toBeFalsy();
  });
});
