import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import MetricsBanner from '@kubewarden/components/MetricsBanner';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';

import { METRICS_DASHBOARD } from '@kubewarden/types';

describe('component: MetricsBanner', () => {
  it('metrics banner displays correctly when uninstalled', () => {
    const wrapper = shallowMount(MetricsBanner as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { metricsType: METRICS_DASHBOARD.POLICY_SERVER },
      computed:  {
        monitoringStatus: () => {
          return { installed: false };
        },
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentProduct:         () => 'current_product',
            monitoringChart:        () => null,
            'current_product/all':  jest.fn(),
            'i18n/t':               jest.fn()
          },
        }
      },
      stubs: { AsyncButton: { template: '<span />' } }
    });

    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(banner.html().includes('<span>%kubewarden.monitoring.notInstalled%</span>')).toBe(true);
  });

  it('button to add dashboard displays when installed with no dashboard found', () => {
    const wrapper = shallowMount(MetricsBanner as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { metricsType: METRICS_DASHBOARD.POLICY_SERVER },
      computed:  {
        monitoringStatus: () => {
          return { installed: true };
        },
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentProduct:         () => 'current_product',
            monitoringChart:        () => null,
            'current_product/all':  jest.fn(),
            'cluster/matching':     jest.fn(),
            'i18n/t':               jest.fn()
          },
        }
      },
    });

    const button = wrapper.findComponent(AsyncButton);

    expect(button.exists()).toBe(true);
    expect(button.html().includes('mode="grafanaDashboard"')).toBe(true);
  });

  it('button to add dashboard not displayed when reload is required', () => {
    const wrapper = shallowMount(MetricsBanner as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { metricsType: METRICS_DASHBOARD.POLICY_SERVER, reloadRequired: true },
      computed:  {
        monitoringStatus: () => {
          return { installed: true };
        },
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentProduct:         () => 'current_product',
            monitoringChart:        () => null,
            'current_product/all':  jest.fn(),
            'cluster/matching':     jest.fn(),
            'i18n/t':               jest.fn()
          },
        }
      },
    });

    const button = wrapper.findComponent(AsyncButton);
    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(button.exists()).toBe(false);
    expect(banner.html().includes('%kubewarden.metrics.reload%')).toBe(true);
  });

  it('warning banner displays when metrics is installed and service is falsy', () => {
    const wrapper = shallowMount(MetricsBanner as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { metricsType: METRICS_DASHBOARD.POLICY_SERVER },
      computed:  {
        monitoringStatus: () => {
          return { installed: true };
        }
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentProduct:         () => 'current_product',
            monitoringChart:        () => null,
            'current_product/all':  jest.fn(),
            'i18n/t':               jest.fn()
          },
        }
      },
    });

    const banner = wrapper.findComponent(Banner);

    expect(banner.exists()).toBe(true);
    expect(banner.html().includes('%kubewarden.metrics.notInstalled%')).toBe(true);
  });
});
