import { ARTIFACTHUB_PKG_ANNOTATION } from '@kubewarden/types';

import { createWrapper } from '@tests/unit/_utils_/wrapper';
import PolicyDetail from '@kubewarden/components/Policies/PolicyDetail.vue';

const commonMocks = { $fetchState: { pending: false } };
const commonComputed = { monitoringStatus: () => jest.fn() };

const defaultPropsData = { resource: '', value: {} };
const createPolicyDetailWrapper = createWrapper(PolicyDetail, commonMocks, commonComputed, defaultPropsData);

describe('PolicyDetail.vue', () => {
  it('computes dashboardVars correctly', () => {
    const wrapper = createPolicyDetailWrapper({ propsData: { value: { id: 'test-id' } } });

    expect(wrapper.vm.dashboardVars).toEqual({ policy_name: 'clusterwide-test-id' });
  });

  it('initializes policyReadme as null', () => {
    const wrapper = createPolicyDetailWrapper();

    expect(wrapper.vm.policyReadme).toBeNull();
  });

  it('fetches artifactHub package if available', async() => {
    const wrapper = createPolicyDetailWrapper({
      propsData: {
        value: {
          metadata:                  { annotations: { [ARTIFACTHUB_PKG_ANNOTATION]: true } },
          artifactHubPackageVersion: jest.fn().mockResolvedValue({ readme: 'test-readme' })
        }
      }
    });

    await wrapper.vm.$nextTick;

    expect(wrapper.vm.policyReadme).toBe('test-readme');
  });

  it('handles errors in fetch gracefully', async() => {
    console.warn = jest.fn(); // eslint-disable-line no-console

    const wrapper = createPolicyDetailWrapper({
      propsData: {
        value: {
          metadata:                  { annotations: { [ARTIFACTHUB_PKG_ANNOTATION]: true } },
          artifactHubPackageVersion: jest.fn().mockRejectedValue(new Error('fetch error'))
        }
      }
    });

    await wrapper.vm.$nextTick;

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Unable to fetch artifacthub package')); // eslint-disable-line no-console
  });
});
