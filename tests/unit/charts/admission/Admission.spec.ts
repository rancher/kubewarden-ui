import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import Admission from '@kubewarden/chart/kubewarden/admission/index.vue';
import Settings from '@kubewarden/chart/kubewarden/admission/Settings.vue';
import Questions from '@kubewarden/components/Questions/index.vue';

import { DEFAULT_POLICY } from '@kubewarden/plugins/policy-class';
import policyConfig from '../../templates/policyConfig';
import { question } from '../../templates/questions';

describe('component: Rules', () => {
  it('settings component should be shown when custom policy', () => {
    const wrapper = shallowMount(Admission as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        customPolicy: true,
        value:        { policy: DEFAULT_POLICY }
      }
    });

    const settings = wrapper.findComponent(Settings);

    expect(settings.exists()).toBe(true);
  });

  it('settings component should be shown when policy has no questions', () => {
    const wrapper = shallowMount(Admission as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        customPolicy: false,
        value:        { policy: policyConfig, questions: {} }
      }
    });

    const settings = wrapper.findComponent(Settings);

    expect(settings.exists()).toBe(true);
  });

  it('questions component should be shown when policy has questions', () => {
    const wrapper = shallowMount(Admission as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: {
        customPolicy: false,
        value:        { policy: policyConfig, questions: { questions: question } }
      }
    });

    const q = wrapper.findComponent(Questions);

    expect(q.exists()).toBe(true);
  });
});
