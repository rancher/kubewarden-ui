import { ExtendedVue, Vue } from 'vue/types/vue';
import { DefaultProps } from 'vue/types/options';
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from '@jest/globals';

import PolicyServer from '@kubewarden/detail/policies.kubewarden.io.policyserver.vue';
import MetricsBanner from '@kubewarden/components/MetricsBanner';
import CountGauge from '@shell/components/CountGauge';

import TraceTestData from '../templates/policyTraces';

const policyGauges = {
  Active: {
    count: 42,
    color: 'success'
  },
  Pending: {
    count: 13,
    color: 'info'
  }
};

const relatedPolicies = () => {
  let out = 0;

  for ( const key of Object.keys(policyGauges) ) {
    out += policyGauges[key].count;
  }

  return out;
};

describe('component: PolicyServer', () => {
  it('policy gauges display correct info', () => {
    const wrapper = shallowMount(PolicyServer as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: {} },
      data() {
        return { policyGauges };
      },
      computed:  {
        monitoringStatus: () => {
          return { installed: false };
        },
        relatedPoliciesTotal: () => relatedPolicies()
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/policyTraces':       () => TraceTestData
          },
        }
      },
      stubs: {
        ResourceTabs:  { template: '<span />' },
        Tab:           { template: '<span />' },
        MetricsBanner: { template: '<span />' },
        TraceTable:    { template: '<span />' },
        Banner:        { template: '<span />' }
      }
    });

    const gauges = wrapper.findAllComponents(CountGauge);
    const activeGauge = gauges.at(0).props();
    const pendingGauge = gauges.at(1).props();

    expect(activeGauge.name).toStrictEqual('Active' as String);
    expect(activeGauge.total).toStrictEqual(relatedPolicies() as Number);
    expect(activeGauge.useful).toStrictEqual(policyGauges['Active'].count as Number);
    expect(activeGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(policyGauges['Active'].color as String);

    expect(pendingGauge.name).toStrictEqual('Pending' as String);
    expect(pendingGauge.total).toStrictEqual(relatedPolicies() as Number);
    expect(pendingGauge.useful).toStrictEqual(policyGauges['Pending'].count as Number);
    expect(pendingGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(policyGauges['Pending'].color as String);
  });

  it('tracing gauges display correct info', () => {
    const traceCounts = {
      Denied: {
        count: 42,
        color: 'error'
      },
      Mutated: {
        count: 13,
        color: 'warning'
      }
    };

    const wrapper = shallowMount(PolicyServer as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: {} },
      data() {
        return { policyGauges };
      },
      computed:  {
        monitoringStatus: () => {
          return { installed: false };
        },
        relatedPoliciesTotal: () => relatedPolicies(),
        policyTraces:         () => TraceTestData,
        tracesGauges:         () => traceCounts,
        emptyTraces:          () => false
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/policyTraces':       () => TraceTestData
          },
        }
      },
      stubs: {
        ResourceTabs:  { template: '<span />' },
        Tab:           { template: '<span />' },
        MetricsBanner: { template: '<span />' },
        TraceTable:    { template: '<span />' },
        Banner:        { template: '<span />' }
      }
    });

    const gauges = wrapper.findAllComponents(CountGauge);
    const deniedGauge = gauges.at(2).props();
    const mutatedGauge = gauges.at(3).props();

    expect(deniedGauge.name).toStrictEqual('Denied' as String);
    expect(deniedGauge.useful).toStrictEqual(42 as Number);
    expect(deniedGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(traceCounts['Denied'].color as String);

    expect(mutatedGauge.name).toStrictEqual('Mutated' as String);
    expect(mutatedGauge.useful).toStrictEqual(13 as Number);
    expect(mutatedGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(traceCounts['Mutated'].color as String);
  });

  it('metrics banner displays when uninstalled', () => {
    const wrapper = shallowMount(PolicyServer as unknown as ExtendedVue<Vue, {}, {}, {}, DefaultProps>, {
      propsData: { value: {} },
      computed:  {
        monitoringStatus: () => {
          return { installed: true };
        },
      },
      mocks:     {
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            currentProduct:                  () => 'current_product',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/policyTraces':       () => TraceTestData
          },
        }
      },
      stubs: {
        CountGauge:  { template: '<span />' },
        TraceTable:  { template: '<span />' },
        Banner:      { template: '<span />' }
      }
    });

    const banner = wrapper.findComponent(MetricsBanner);

    expect(banner.exists()).toBe(true);
    expect(banner.props().metricsService).toBeFalsy();
  });
});
