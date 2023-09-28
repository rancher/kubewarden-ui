import { importTypes } from '@rancher/auto-import';
import {
  IPlugin, TableColumnLocation, TabLocation, PanelLocation, OnNavToPackage
} from '@shell/core/types';
import { NAMESPACE } from '@shell/config/types';

import kubewardenRoutes from './routes/kubewarden-routes';
import kubewardenStore from './store/kubewarden';
import { getPolicyReports } from './modules/policyReporter';

// fix missing directives on dashboard v2.7.2
import '@shell/plugins/clean-tooltip-directive';
import '@shell/plugins/clean-html-directive';

const onEnter: OnNavToPackage = async(store) => {
  await getPolicyReports(store);
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

  /** Tabs */
  $plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    { resource: [NAMESPACE] },
    {
      name:       'policy-report-tab',
      labelKey:   'kubewarden.policyReporter.headers.label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./components/PolicyReporter/ResourceTab.vue')
    }
  );

  $plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    { resource: ['pod'] },
    {
      name:       'policy-report-tab',
      labelKey:   'kubewarden.policyReporter.headers.label',
      weight:     -5,
      showHeader: true,
      tooltip:    'this is a tooltip message',
      component:  () => import('./components/PolicyReporter/ResourceTab.vue')
    }
  );
}
