<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import isEmpty from 'lodash/isEmpty';

import { CATALOG, POD, UI_PLUGIN } from '@shell/config/types';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';
import { allHash } from '@shell/utils/promise';

import Loading from '@shell/components/Loading';

import { DASHBOARD_HEADERS } from '@kubewarden/config/table-headers';
import { KUBEWARDEN, KUBEWARDEN_APPS, KUBEWARDEN_CHARTS, WG_POLICY_K8S } from '@kubewarden/types';

import { isPolicyServerResource } from '@kubewarden/modules/policyServer';

import Masthead from '@kubewarden/components/Dashboard/Masthead.vue';
import PoliciesCard from '@kubewarden/components/Dashboard/PoliciesCard.vue';
import { RcItemCard } from '@components/RcItemCard';
import VerticalGap from '@shell/components/Resource/Detail/Card/VerticalGap.vue';
import ResourceRow from '@kubewarden/components/ResourceRow.vue';
import EmptyRow from '@kubewarden/components/Dashboard/EmptyRow.vue';

const store = useStore();
const fetchState = ref({
  pending: true,
  error:   null
});

const charts = computed(() => store.getters['catalog/charts']);
const allApps = computed(() => store.getters['cluster/all'](CATALOG.APP));
const allPods = computed(() => store.getters['cluster/all'](POD));
const allPolicyServers = computed(() => store.getters['cluster/all'](KUBEWARDEN.POLICY_SERVER));

const controllerApp = computed(() => {
  if (allApps.value) {
    return allApps.value?.find((a: any) => {
      return (
        a.spec?.chart?.metadata?.annotations?.[CATALOG_ANNOTATIONS.RELEASE_NAME] === KUBEWARDEN_APPS.RANCHER_CONTROLLER ||
        a.spec?.chart?.metadata?.name === KUBEWARDEN_CHARTS.CONTROLLER
      );
    });
  }

  return null;
});

const policyServerPods = computed(() => {
  if (store.getters['cluster/canList'](POD)) {
    const policyServerNames = allPolicyServers.value
      ?.map((ps: any) => ps.metadata?.name)
      .filter((name: string) => !!name);

    const pods = allPods.value?.filter((pod: any) => {
      const labels = pod?.metadata?.labels;

      return policyServerNames?.some((name: string) => isPolicyServerResource(labels, name));
    });

    if (!isEmpty(pods)) {
      return pods;
    }

    return null;
  }

  return null;
});

const clusterPolicies = computed(() => store.getters['cluster/all'](KUBEWARDEN.CLUSTER_ADMISSION_POLICY));
const namespacedPolicies = computed(() => store.getters['cluster/all'](KUBEWARDEN.ADMISSION_POLICY));
const policyReports = computed(() => {
  return {
    [WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE]: store.getters['cluster/all'](WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE),
    [WG_POLICY_K8S.POLICY_REPORT.TYPE]:         store.getters['cluster/all'](WG_POLICY_K8S.POLICY_REPORT.TYPE)
  };
});

const admissionPolicyResults = computed(() => {
  if (!isEmpty(policyReports.value[WG_POLICY_K8S.POLICY_REPORT.TYPE])) {
    let out: any[] = [];

    policyReports.value[WG_POLICY_K8S.POLICY_REPORT.TYPE].filter((report: any) => {
      const results = report?.results?.filter((result: any) => result?.policy.includes('namespaced-'));

      if (!isEmpty(results)) {
        out = [...out, ...results];
      }
    });

    return out;
  }

  return [];
});

const clusterPolicyResults = computed(() => {
  if (!isEmpty(policyReports.value)) {
    const pr = policyReports.value[WG_POLICY_K8S.POLICY_REPORT.TYPE];
    const cpr = policyReports.value[WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE];
    let out: any[] = [];

    if (!isEmpty(cpr)) {
      const results = cpr.flatMap((report: any) => report?.results);

      out = [...out, ...results];
    }

    if (!isEmpty(pr)) {
      const results = pr.flatMap((report: any) => {
        return report?.results?.filter((result: any) => !result?.policy.includes('namespaced-'));
      });

      out = [...out, ...results];
    }

    return out;
  }

  return [];
});

const showReports = computed(() => {
  if (controllerApp.value) {
    const auditScanner = controllerApp.value.values?.auditScanner;

    // The enable property will not exist if the auditScanner is enabled.
    // If the enable property exists and is set to false, the auditScanner is disabled.
    return auditScanner?.enable !== false;
  }

  return false;
});

// Methods
const mapRow = (policies: any[]) => {
  const total = policies.length;
  const getPercentage = (count: number) => count ? Math.round((count / total) * 100) : 0;

  const stats = policies?.reduce((acc: any, item: any) => {
    const isActive = item?.result === 'pass';
    const isError = item?.result === 'fail';

    return {
      rows: [{
        count:   acc.rows[0].count + isActive,
        percent: getPercentage(acc.rows[0].count + isActive),
      },
      {
        count:   acc.rows[1].count + isError,
        percent: getPercentage(acc.rows[1].count + isError),
      }],
      mode: {
        protect: acc.mode.protect + (item?.spec?.mode === 'protect' ? 1 : 0),
        monitor: acc.mode.monitor + (item?.spec?.mode === 'monitor' ? 1 : 0)
      },
      total
    };
  }, {
    rows: [{
      count:   0,
      percent: 0,
    },
    {
      count:   0,
      percent: 0,
    }],
    mode: {
      protect: 0,
      monitor: 0
    },
    total
  });

  return {
    rows: [{
      ...stats.rows[0],
      label:   'kubewarden.dashboard.cards.generic.success',
      color:   'success'
    }, {
      ...stats.rows[1],
      label:   'kubewarden.dashboard.cards.generic.error',
      color:   'error'
    }],
    mode: stats.mode
  };
};

const namespacedStats = computed(() => mapRow(namespacedPolicies.value));
const clusterStats = computed(() => mapRow(clusterPolicies.value));
const namespacesResults = computed(() => mapRow(admissionPolicyResults.value));
const clusterResults = computed(() => mapRow(clusterPolicyResults.value));

const policyServersWithStatusAndModes = computed(() => {
  return allPolicyServers.value.map((server: any) => {
    const name = server.metadata?.name;

    const podsForThisServer = (policyServerPods.value || []).filter((pod: any) => {
      const labels = pod?.metadata?.labels;

      return isPolicyServerResource(labels, name);
    });

    let runningCount = 0;
    let pendingCount = 0;
    let errorCount   = 0;

    podsForThisServer.forEach((pod: any) => {
      if (pod?.metadata?.state?.name === 'running') {
        runningCount++;
      } else if (pod?.metadata?.state?.transitioning) {
        pendingCount++;
      } else if (pod?.metadata?.state?.error) {
        errorCount++;
      }
    });

    const totalPods   = podsForThisServer.length;
    let color = 'error'; // default

    if (runningCount === totalPods && totalPods > 0) {
      color = 'success';
    } else if (pendingCount > 0) {
      color = 'warning';
    } else if (errorCount > 0) {
      color = 'error';
    }

    // Counts how many policies (namespaced + cluster) reference this server
    const allPolicies = [...namespacedPolicies.value, ...clusterPolicies.value];
    const polsForThisServer = allPolicies.filter((p: any) => p.spec?.policyServer === name);

    let monitorCount = 0;
    let protectCount = 0;

    polsForThisServer.forEach((p: any) => {
      if (p.spec?.mode === 'monitor') {
        monitorCount++;
      } else if (p.spec?.mode === 'protect') {
        protectCount++;
      }
    });

    return {
      label:  name,
      to:     server.detailLocation,
      color,
      counts: [
        {
          count: protectCount,
          label: 'protect'
        },
        {
          count: monitorCount,
          label: 'monitor'
        }
      ]
    };
  });
});

// Fetch data on mount
onMounted(async() => {
  try {
    fetchState.value.pending = true;

    const hash: Record<string, Promise<any>> = {};
    const types = [
      WG_POLICY_K8S.CLUSTER_POLICY_REPORT.TYPE,
      WG_POLICY_K8S.POLICY_REPORT.TYPE,
      KUBEWARDEN.ADMISSION_POLICY,
      KUBEWARDEN.CLUSTER_ADMISSION_POLICY,
      KUBEWARDEN.POLICY_SERVER,
      POD,
      CATALOG.APP,
      CATALOG.CLUSTER_REPO,
      UI_PLUGIN
    ];

    for (const type of types) {
      if (store.getters['cluster/canList'](type)) {
        hash[type] = store.dispatch('cluster/findAll', { type });
      }
    }

    await allHash(hash);

    if (isEmpty(charts.value)) {
      await store.dispatch('catalog/load');
    }

    if (controllerApp.value) {
      await controllerApp.value.fetchValues(true);
    }

    fetchState.value.pending = false;
  } catch (error) {
    fetchState.value.error = error;
    fetchState.value.pending = false;
  }
});
</script>

<template>
  <Loading v-if="fetchState.pending" />
  <div v-else class="dashboard">
    <Masthead :controller-app="controllerApp" />

    <div class="get-started">
      <template
        v-for="(card, index) in DASHBOARD_HEADERS"
        :key="index"
      >
        <RcItemCard
          :id="`card-${index}`"
          :value="card"
          variant="small"
          :header="{
            title: { text: t(card.title) },
            statuses: [],
          }"
          :content="{}"
        >
          <!-- Cards Content -->
          <template #item-card-content>
            <!-- Namespace card -->
            <template v-if="index === 0">
              <VerticalGap />
              <PoliciesCard
                :results="namespacesResults"
                :stats="namespacedStats"
                :show-reports="showReports"
                :empty-label="t('kubewarden.dashboard.cards.namespaced.empty')"
                :protect-link="card.modeLink({ q: 'protect' })"
                :monitor-link="card.modeLink({ q: 'monitor' })"
                :create-link="card.createLink"
                data-test-id="kw-dashboard-ap-gauge"
              />
            </template>

            <!-- Cluster card -->
            <template v-if="index === 1">
              <VerticalGap />
              <PoliciesCard
                :results="clusterResults"
                :stats="clusterStats"
                :show-reports="showReports"
                :empty-label="t('kubewarden.dashboard.cards.cluster.empty')"
                :protect-link="card.modeLink({ q: 'protect' })"
                :monitor-link="card.modeLink({ q: 'monitor' })"
                :create-link="card.createLink"
                data-test-id="kw-dashboard-cap-gauge"
              />
            </template>

            <!-- Servers list card -->
            <template v-else-if="index === 2">
              <template v-if="policyServersWithStatusAndModes.length > 0">
                <VerticalGap />
                <ResourceRow
                  class="dashboard__servers"
                  v-for="(row, i) in policyServersWithStatusAndModes"
                  :key="`resource-row-${index}-${i}`"
                  :label="row.label"
                  :color="row.color"
                  :to="row.to"
                  :counts="row.counts"
                />
              </template>

              <template v-else>
                <VerticalGap />
                <EmptyRow
                  class="dashboard__servers"
                  :to="card.createLink"
                  linkText="kubewarden.dashboard.cards.server.new"
                  emptyText="kubewarden.dashboard.cards.server.empty"
                />
              </template>
            </template>
          </template>
        </RcItemCard>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;

  .get-started {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    grid-gap: 20px;
  }

  &__servers {
    display: flex;
    width: 100%;
  }
}
</style>
