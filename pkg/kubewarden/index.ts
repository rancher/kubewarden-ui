import { importTypes } from '@rancher/auto-import';
import {
  IPlugin, TableColumnLocation, TabLocation, PanelLocation, OnNavToPackage
} from '@shell/core/types';
import {
  NAMESPACE, POD, WORKLOAD_TYPES, INGRESS, SERVICE
} from '@shell/config/types';

import kubewardenRoutes from './routes/kubewarden-routes';
import kubewardenStore from './store/kubewarden';
import { getReports } from './modules/policyReporter';

// fix missing directives on dashboard v2.7.2
import '@shell/plugins/clean-tooltip-directive';
import '@shell/plugins/clean-html-directive';

const onEnter: OnNavToPackage = async(store) => {
  await getReports(store, false);
  await getReports(store, true);
};

// Init the package
export default function($plugin: IPlugin, args: any) {
  // Auto-import model, detail, edit from the folders
  importTypes($plugin);

  // Provide plugin metadata from package.json
  $plugin.metadata = require('./package.json');

  // Load product
  $plugin.addProduct(require('./config/kubewarden'));

  // Add Vuex store
  $plugin.addDashboardStore(kubewardenStore.config.namespace, kubewardenStore.specifics, kubewardenStore.config);

  // Routes
  $plugin.addRoutes(kubewardenRoutes);

  // Add hooks to Vue navigation world
  $plugin.addNavHooks(onEnter);

  /** Panels */
  $plugin.addPanel(
    PanelLocation.RESOURCE_LIST,
    { path: [{ urlPath: 'explorer/projectsnamespaces', endsWith: true }] },
    { component: () => import('./components/PolicyReporter/ReporterPanel.vue') }
  );

  $plugin.addPanel(
    PanelLocation.RESOURCE_LIST,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
        INGRESS,
        SERVICE
      ]
    },
    { component: () => import('./components/PolicyReporter/ReporterPanel.vue') }
  );

  /** Columns */
  $plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    { path: [{ urlPath: 'explorer/projectsnamespaces', endsWith: true }] },
    {
      name:      'policy-reports',
      labelKey:  'kubewarden.policyReporter.headers.label',
      getValue:  (row: any) => row,
      weight:    3,
      formatter: 'PolicyReportSummary'
    }
  );

  $plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      resource: [
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
        INGRESS,
        SERVICE
      ]
    },
    {
      name:      'policy-reports',
      labelKey:  'kubewarden.policyReporter.headers.label',
      getValue:  (row: any) => row,
      weight:    3,
      formatter: 'PolicyReportSummary'
    }
  );

  /** Tabs */
  $plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: [
        NAMESPACE,
        POD,
        WORKLOAD_TYPES.CRON_JOB,
        WORKLOAD_TYPES.DAEMON_SET,
        WORKLOAD_TYPES.DEPLOYMENT,
        WORKLOAD_TYPES.JOB,
        WORKLOAD_TYPES.STATEFUL_SET,
        INGRESS,
        SERVICE
      ]
    },
    {
      name:       'policy-report-tab',
      labelKey:   'kubewarden.policyReporter.headers.label',
      weight:     -5,
      showHeader: true,
      component:  () => import('./components/PolicyReporter/ResourceTab.vue')
    }
  );
}
