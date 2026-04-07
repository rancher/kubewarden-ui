import { importTypes } from '@rancher/auto-import';
import { TableColumnLocation, TabLocation, PanelLocation } from '@shell/core/types';
import {
  NAMESPACE, POD, WORKLOAD_TYPES, INGRESS, SERVICE
} from '@shell/config/types';

import kubewardenRoutes from './routes/kubewarden-routes';
import kubewardenStore from './store/kubewarden';

// Init the package
export default function($extension: any) {
  // Auto-import model, detail, edit from the folders
  importTypes($extension);

  // Provide plugin metadata from package.json
  $extension.metadata = require('./package.json');

  // Load product
  $extension.addProduct(require('./config/kubewarden'));

  // Add Vuex store
  $extension.addDashboardStore(kubewardenStore.config.namespace, kubewardenStore.specifics, kubewardenStore.config);

  // Routes
  $extension.addRoutes(kubewardenRoutes);

  /** Panels */
  $extension.addPanel(
    PanelLocation.RESOURCE_LIST,
    {
      path: [{
        urlPath:  'explorer/projectsnamespaces',
        endsWith: true
      }]
    },
    { component: () => import('./components/PolicyReporter/ReporterPanel.vue') }
  );

  $extension.addPanel(
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
  // Policy Reports for Project Namespaces
  $extension.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      path: [{
        urlPath:  'explorer/projectsnamespaces',
        endsWith: true
      }]
    },
    {
      name:      'policy-reports',
      labelKey:  'kubewarden.policyReporter.headers.policyReports.label',
      getValue:  (row: any) => row,
      weight:    3,
      formatter: 'PolicyReportSummary'
    }
  );

  // Policy Reports for namespaced resources
  $extension.addTableColumn(
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
  $extension.addTab(
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
