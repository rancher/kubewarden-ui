import { shallowMount } from '@vue/test-utils';

import Admission from '@kubewarden/chart/kubewarden/admission/index.vue';
import Settings from '@kubewarden/chart/kubewarden/admission/Settings.vue';
import Questions from '@kubewarden/components/Questions/index.vue';

import { KUBEWARDEN } from '@kubewarden/constants';
import { DEFAULT_POLICY } from '@kubewarden/types';

import { userGroupPolicy } from '@tests/unit/mocks/policyConfig';
import { question } from '@tests/unit/mocks/questions';

describe('component: Admission', () => {
  it('settings component should be shown when custom policy', () => {
    const wrapper = shallowMount(Admission, {
      props: {
        customPolicy: true,
        value:        { policy: DEFAULT_POLICY }
      },
      global: {
        provide: { chartType: KUBEWARDEN.ADMISSION_POLICY },
        stubs:   { Tab: { template: '<div><slot /></div>' } }
      }
    });

    const settings = wrapper.findComponent(Settings);

    expect(settings.exists()).toBe(true);
  });

  it('settings component should be shown when policy has no questions', () => {
    const wrapper = shallowMount(Admission, {
      props: {
        customPolicy: false,
        value:        {
          policy:    userGroupPolicy,
          questions: {}
        }
      },
      global: {
        provide: { chartType: KUBEWARDEN.ADMISSION_POLICY },
        stubs:   { Tab: { template: '<div><slot /></div>' } }
      }

    });

    const settings = wrapper.findComponent(Settings);

    expect(settings.exists()).toBe(true);
  });

  it('questions component should be shown when policy has questions', () => {
    const wrapper = shallowMount(Admission, {
      props: {
        customPolicy: false,
        value:        {
          policy:    userGroupPolicy,
          questions: { questions: question }
        }
      },
      global: {
        provide: { chartType: KUBEWARDEN.ADMISSION_POLICY },
        stubs:   { Tab: { template: '<div><slot /></div>' } }
      }
    });

    const q = wrapper.findComponent(Questions);

    expect(q.exists()).toBe(true);
  });
});
