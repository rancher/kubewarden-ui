import { shallowMount } from '@vue/test-utils';

import PolicyServer from '@kubewarden/detail/policies.kubewarden.io.policyserver.vue';
import CountGauge from '@shell/components/CountGauge';

import TraceTestData from '@tests/unit/mocks/policyTraces';

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

  for (const key of Object.keys(policyGauges) as Array<keyof typeof policyGauges>) {
    out += policyGauges[key].count;
  }

  return out;
};

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

const createWrapper = (props = {}, mocks = {}) => {
  return shallowMount(PolicyServer, {
    props: {
      value: {},
      ...props
    },
    data() {
      return { policyGauges } as any;
    },
    computed:  {
      monitoringStatus: () => {
        return { installed: false };
      },
      relatedPoliciesTotal: () => relatedPolicies(),
      policyTraces:         () => TraceTestData,
      emptyTraces:          () => false,
      tracesGauges:         () => traceCounts,
      traceGaugeTotals:     () => {
        let out = 0;

        for (const key of Object.keys(traceCounts) as Array<keyof typeof traceCounts>) {
          out += traceCounts[key].count;
        }

        return out;
      },
    },
    global: {
      mocks:     {
        ...mocks,
        $fetchState: { pending: false },
        $store:      {
          getters: {
            currentCluster:                  () => 'current_cluster',
            'current_product/all':           jest.fn(),
            'i18n/t':                        jest.fn(),
            'kubewarden/policyTraces':       () => TraceTestData
          },
        }
      },
      stubs: {
        ResourceTabs:  { template: '<span />' },
        Tab:           { template: '<span />' },
        TraceTable:    { template: '<span />' },
        Banner:        { template: '<span />' },
        CountGauge,
      }
    }
  });
};

describe('component: PolicyServer', () => {
  it('policy gauges display correct info', () => {
    const wrapper = createWrapper();

    const gauges = wrapper.findAllComponents(CountGauge);
    const activeGauge = gauges.at(0)?.props();
    const pendingGauge = gauges.at(1)?.props();

    expect(activeGauge.name).toStrictEqual('Active' as string);
    expect(activeGauge.total).toStrictEqual(relatedPolicies() as number);
    expect(activeGauge.useful).toStrictEqual(policyGauges['Active'].count as number);
    expect(activeGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(policyGauges['Active'].color as string);

    expect(pendingGauge.name).toStrictEqual('Pending' as string);
    expect(pendingGauge.total).toStrictEqual(relatedPolicies() as number);
    expect(pendingGauge.useful).toStrictEqual(policyGauges['Pending'].count as number);
    expect(pendingGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(policyGauges['Pending'].color as string);
  });

  it('tracing gauges display correct info', () => {
    const wrapper = createWrapper();

    const gauges = wrapper.findAllComponents(CountGauge);
    const deniedGauge = gauges.at(2)?.props();
    const mutatedGauge = gauges.at(3)?.props();

    expect(deniedGauge.name).toStrictEqual('Denied' as string);
    expect(deniedGauge.useful).toStrictEqual(42 as number);
    expect(deniedGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(traceCounts['Denied'].color as string);

    expect(mutatedGauge.name).toStrictEqual('Mutated' as string);
    expect(mutatedGauge.useful).toStrictEqual(13 as number);
    expect(mutatedGauge.primaryColorVar.replace('--sizzle-', '')).toStrictEqual(traceCounts['Mutated'].color as string);
  });
});
