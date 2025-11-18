<template>
  <div class="page">
    <div class="header-section">
      <div class="header-left">
        <div class="title-wrap">
          <div class="title">
            {{ t('imageScanner.registries.title') }}
          </div>
        </div>
        <div class="state">
          State as of
          <span class="state-date-time">
            {{ latestUpdateDateText }}&nbsp;&nbsp;&nbsp;&nbsp;{{ latestUpdateTimeText }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <div class="header-btn">
          <button
            v-if="canEdit"
            mat-button
            class="btn role-primary"
            aria-label="Add new"
            type="button"
            @click="openAddEditRegistry()"
          >
            {{ t('imageScanner.registries.button.addNew') }}
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="scanJobCRD && scanJobCRD.length > 0"
      class="summary-section"
    >
      <RecentUpdatedRegistries :registry-status-list="registryStatusList" />
      <DistributionChart
        :filter-fn="filterByStatus"
        :chart-data="statusSummary"
        :title="t('imageScanner.registries.StatusDistribution.title')"
        color-prefix="status"
        :description="t('imageScanner.registries.StatusDistribution.subTitle')"
        :tooltip="t('imageScanner.registries.StatusDistribution.tooltip')"
      />
    </div>
    <RegistryResourceTable :status-filter-link="selectedStatus" />
  </div>
</template>

<script>

import {
  RESOURCE,
  PRODUCT_NAME,
} from '@sbomscanner/types';
import RecentUpdatedRegistries from '@sbomscanner/components/RecentUpdatedRegistries';
import DistributionChart from '@sbomscanner/components/DistributionChart';
import { REGISTRY_SCAN_TABLE } from '@sbomscanner/config/table-headers';
import day from 'dayjs';
import { findBy } from '@shell/utils/array';
import RegistryResourceTable from '@sbomscanner/list/sbomscanner.kubewarden.io.registry.vue';
import { getPermissions } from '@sbomscanner/utils/permissions';

export default {
  name:       'RegistriesOverview',
  components: {
    RecentUpdatedRegistries,
    DistributionChart,
    RegistryResourceTable,
  },
  data() {
    const STATUS_OPTIONS = [
      { value: 'any', label: this.t('imageScanner.general.any') },
      { value: 'scheduled', label: this.t('imageScanner.enum.status.scheduled') },
      { value: 'pending', label: this.t('imageScanner.enum.status.pending') },
      { value: 'inprogress', label: this.t('imageScanner.enum.status.inprogress') },
      { value: 'complete', label: this.t('imageScanner.enum.status.complete') },
      { value: 'failed', label: this.t('imageScanner.enum.status.failed') },
    ];

    return {
      registriesCRD:                    [],
      scanJobCRD:                       [],
      PRODUCT_NAME,
      rows:                             [],
      registryStatusList:               [],
      latestUpdateTime:                 null,
      statusSummary:                    {},
      selectedStatus:                   STATUS_OPTIONS[0].value,
      headers:                          REGISTRY_SCAN_TABLE,
      keepAliveTimer:                   null,
      useQueryParamsForSimpleFiltering: false,
      canEdit:                          getPermissions(this.$store.getters).canEdit,
    };
  },

  async fetch() {
    await this.loadData();
  },
  beforeUnmount() {
    clearInterval(this.keepAliveTimer);
  },
  methods: {
    async loadData() {
      this.scanJobCRD = await this.$store.dispatch('cluster/findAll', { type: RESOURCE.SCAN_JOB });
      await this.preprocessData();
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = setInterval(async() => {
        await this.preprocessData();
      }, 20 * 1000);
    },
    async preprocessData() {
      this.registryStatusList = [];
      this.statusSummary = {};
      const summaryData = this.getSummaryData(this.scanJobCRD);

      this.registryStatusList = summaryData.registryStatusList;
      this.statusSummary = summaryData.statusSummary;
    },
    refresh() {
      this.loadData();
    },
    filterByStatus(status) {
      this.selectedStatus = status;
    },
    openAddEditRegistry() {
      this.$router.push({
        name:   `${ PRODUCT_NAME }-c-cluster-resource-create`,
        params: {
          resource: RESOURCE.REGISTRY,
          cluster:  this.$route.params.cluster,
          product:  PRODUCT_NAME
        }
      });
    },
    onSelectionChange(selected) {
      this.selectedRows = selected || [];
    },
    async promptRemoveRegistry() {
      const table = this.$refs.registryTable.$refs.table.$refs.table;
      const act = findBy(table.availableActions, 'action', 'promptRemove');

      if ( act ) {
        table.setBulkActionOfInterest(act);
        table.applyTableAction(act);
      }
    },
    getSummaryData(scanJobCRD) {
      this.latestUpdateTime = new Date();
      const registryStatusMap = new Map();
      const registryStatusList = [];
      const statusSummary = {
        pending:    0,
        scheduled:  0,
        inprogress: 0,
        complete:   0,
        failed:     0
      };

      scanJobCRD.sort((a, b) => {
        if (!a.status || !a.status.conditions || !Array.isArray(a.status.conditions) || a.status.conditions.length === 0) {
          return 1;
        }
        if (!b.status || !b.status.conditions || !Array.isArray(b.status.conditions) || b.status.conditions.length === 0) {
          return -1;
        }

        return this.getLastTransitionTime(b.status.conditions) - this.getLastTransitionTime(a.status.conditions);
      });

      scanJobCRD.forEach((job) => {
        if (job?.spec?.registry && job?.metadata?.namespace) {
          const key = `${ job.metadata.namespace }/${ job.spec.registry }`;

          if (!registryStatusMap.has(key)) {
            registryStatusMap.set(key, [{
              statusResult:       this.getStatusResult(job),
              conditions:         job.status?.conditions || [],
              registryName:       job.spec.registry,
              namespace:          job.metadata.namespace,
              uri:                this.getUri(job.metadata.annotations['sbomscanner.kubewarden.io/registry']),
              lastTransitionTime: job.status?.conditions ? this.getLastTransitionTime(job.status.conditions) : new Date(job.metadata.creationTimestamp).getTime(),
              completionTime:     job.status?.completionTime ? new Date(job.status.completionTime).getTime() : 0,
            }]);
          } else {
            const rec = registryStatusMap.get(key);
            const statusResult = this.getStatusResult(job);
            const conditions = job.status?.conditions || [];
            const registryName = job.spec.registry;
            const namespace = job.metadata.namespace;
            const uri = this.getUri(job.metadata.annotations['sbomscanner.kubewarden.io/registry']);
            const lastTransitionTime = job.status?.conditions ? this.getLastTransitionTime(job.status.conditions) : new Date(job.metadata.creationTimestamp).getTime();
            const completionTime = job.status?.completionTime ? new Date(job.status.completionTime).getTime() : 0;

            if (rec && rec.length > 0 && rec.length < 2) {
              rec.push({
                statusResult,
                conditions,
                registryName,
                namespace,
                uri,
                lastTransitionTime,
                completionTime
              });
            }
            registryStatusMap.set(key, rec);
          }
        }
      });
      const top5StatusUpdates = Array.from(registryStatusMap.values()).slice(0, 5);

      top5StatusUpdates.forEach((rec) => {
        registryStatusList.push({
          registryName:       rec[0].registryName,
          namespace:          rec[0].namespace,
          uri:                rec[0].uri,
          prevScanStatus:     this.getPreviousStatus(rec),
          currStatus:         rec[0].statusResult.type.toLowerCase(),
          lastTransitionTime: Math.max(new Date(rec[0].lastTransitionTime), new Date(rec[0].completionTime))
        });

        // Summarize the data for Status distribution panel
        if (Object.prototype.hasOwnProperty.call(statusSummary, rec[0].statusResult.type.toLowerCase())) {
          statusSummary[rec[0].statusResult.type.toLowerCase()]++;
        }
      });
      // Sort and limit the registryStatusList to 5 most recent updates
      registryStatusList.sort((a, b) => new Date(b.lastTransitionTime) - new Date(a.lastTransitionTime)).slice(0, 5);
      while (registryStatusList.length < 5) {
        registryStatusList.push({
          registryName:       '',
          namespace:          '',
          uri:                '',
          prevScanStatus:     '',
          currStatus:         '',
          lastTransitionTime: new Date().toISOString()
        });
      }

      return {
        registryStatusList,
        statusSummary
      };
    },
    getLastTransitionTime(conditions) {
      let lastTransitionTime = 0;

      conditions.forEach((condition) => {
        lastTransitionTime = Math.max(lastTransitionTime, new Date(condition.lastTransitionTime).getTime());
      });

      return lastTransitionTime;
    },
    getUri(registryJson) {
      try {
        const regObj = JSON.parse(registryJson);

        return regObj.spec.uri || '';
      } catch (e) {
        return '';
      }
    },
    getStatusResult(scanjob) {
      if (!scanjob.status) { // A extreme corner case, the scanner created a job without status object
        return {
          type:               'Pending',
          lastTransitionTime: null,
          statusIndex:        -1
        };
      }
      const statusIndex = scanjob.status.conditions?.findIndex((condition) => {
        return condition.status === 'True';
      });

      return statusIndex > -1 ? {
        type:               scanjob.status.conditions[statusIndex].type,
        lastTransitionTime: scanjob.status.conditions[statusIndex].lastTransitionTime,
        message:            scanjob.status.conditions[statusIndex].message,
        statusIndex
      } : {
        type:               'Pending',
        lastTransitionTime: null,
        statusIndex:        -1
      };
    },
    getPreviousStatus(scanjobs) {
      if (scanjobs && scanjobs[0] && scanjobs[0].statusResult && scanjobs[0].statusResult.statusIndex > 0) {
        const index = scanjobs[0].statusResult.statusIndex;

        if (index < 3) {
          return scanjobs[0].conditions[index - 1].type.toLowerCase();
        } else {
          // For failed scan
          return scanjobs[0].conditions[index - 2].type.toLowerCase();
        }
      } else if (scanjobs && scanjobs[1]) {
        return scanjobs[1].statusResult.type.toLowerCase();
      } else {
        return 'none';
      }
    },
  },
  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](RESOURCE.REGISTRY);
    },
    canPaginate() {
      return this.$store.getters[`cluster/paginationEnabled`](RESOURCE.REGISTRY);
    },
    latestUpdateDateText() {
      return day(new Date(this.latestUpdateTime).getTime()).format('MMM D, YYYY');
    },
    latestUpdateTimeText() {
      return day(new Date(this.latestUpdateTime).getTime()).format('h:mm a');
    },
  },
};
</script>

<style lang="scss" scoped>
  .page {
    display: flex;
    flex-direction: column;
    padding: 24px;
    min-height: 100%;
  }

  .header-section {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    align-self: stretch;
  }

  .header-left {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 4px;
      flex: 1 0 0;
    }
  .title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    align-self: stretch;
    .title {
      font-family: Lato;
      font-size: 24px;
      font-style: normal;
      font-weight: 400;
      line-height: 32px; /* 133.333% */
    }
  }

  .state {
    display: -webkit-box;
    max-width: 900px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    align-self: stretch;
    overflow: hidden;
    color: var(--disabled-text);

    text-overflow: ellipsis;
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 21px; /* 150% */

    .state-date-time {
      overflow: hidden;
      -webkit-box-orient: vertical;
      line-clamp: 1;
      color: var(--disabled-text);
      text-overflow: ellipsis;
      font-family: Lato;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 21px;
    }
  }

  .header-right {
    display: flex;
    align-items: flex-end;
    justify-content: end;
    flex: 1 0 0;
    gap: 16px;
  }

  .header-btn {
    height: 40px;
  }

  .icon-add {
    width: 16px;
    height: 16px;
    margin-right: 12px;
    background: url('../../../../assets/img/add.svg') no-repeat center center;
    background-size: contain;
  }

  .icon-refresh-ss {
    width: 16px;
    height: 16px;
    margin-right: 12px;
    background: url('../../../../assets/img/refresh.svg') no-repeat center center;
    background-size: contain;
  }

  .summary-section {
    display: flex;
    min-width: 912px;
    align-items: flex-start;
    align-self: stretch;
    border-radius: 6px;
    border: solid var(--border-width) var(--input-border);
    background: var(--input-bg);
    margin: 24px 0 0 0;
  }

  .score-input {
    color: #BEC1D2;
  }

  .score-input::placeholder {
    color: #BEC1D2;
  }
</style>
