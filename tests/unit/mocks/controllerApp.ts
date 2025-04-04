import { FLEET } from '@shell/config/labels-annotations';
import { CatalogApp } from '@kubewarden/types';

export const controllerAppValuesLegacy: any = {
  auditScanner: {
    enable:         true,
    policyReporter: true
  },
  telemetry: {
    metrics: { enabled: false },
    tracing: { enabled: false }
  }
};

export const mockControllerAppLegacy: CatalogApp = {
  id:         'cattle-kubewarden-system/rancher-kubewarden-controller',
  type:       'app',
  apiVersion: 'catalog.cattle.io/v1',
  kind:       'App',
  metadata:   {
    annotations:       {},
    labels:            {},
    name:              'rancher-kubewarden-controller',
    namespace:         'cattle-kubewarden-system'
  },
  spec: {
    chart: {
      metadata: {
        annotations: {
          'catalog.cattle.io/auto-install':        'kubewarden-crds=1.4.5',
          'catalog.cattle.io/certified':           'rancher',
          'catalog.cattle.io/display-name':        'Kubewarden',
          'catalog.cattle.io/namespace':           'cattle-kubewarden-system',
          'catalog.cattle.io/os':                  'linux',
          'catalog.cattle.io/provides-gvr':        'policyservers.policies.kubewarden.io/v1',
          'catalog.cattle.io/rancher-version':     '>= 2.6.0-0 <= 2.8.100-0',
          'catalog.cattle.io/release-name':        'rancher-kubewarden-controller',
          'catalog.cattle.io/requests-cpu':        '250m',
          'catalog.cattle.io/requests-memory':     '50Mi',
          'catalog.cattle.io/type':                'cluster-tool',
          'catalog.cattle.io/ui-component':        'kubewarden',
          'catalog.cattle.io/ui-source-repo':      'kubewarden-charts',
          'catalog.cattle.io/ui-source-repo-type': 'cluster',
          'catalog.cattle.io/upstream-version':    '2.0.9'
        },
        apiVersion:  'v2',
        appVersion:  'v1.11.0',
        name:       'kubewarden-controller',
        type:       'application',
        version:    '2.0.9'
      },
      values: {}
    },
    info:      { status: 'deployed' },
    name:      'rancher-kubewarden-controller',
    namespace: 'cattle-kubewarden-system',
    values:    {}
  },
  status: { summary: { state: 'deployed' } },
  values: { ...controllerAppValuesLegacy }
};

export const mockControllerAppWithFleet: CatalogApp = {
  ...mockControllerAppLegacy,
  spec: {
    ...mockControllerAppLegacy.spec,
    chart: {
      ...mockControllerAppLegacy.spec.chart,
      metadata: {
        ...mockControllerAppLegacy.spec.chart.metadata,
        annotations: {
          ...mockControllerAppLegacy.spec.chart.metadata.annotations,
          [FLEET.BUNDLE_ID]: 'fleet-default/kw-kubewarden-defaults'
        }
      }
    }
  }
};

export const controllerAppValues: any = {
  auditScanner: { policyReporter: true },
  global:       {
    cattle: {
      clusterId:             'local',
      clusterName:           'local',
      rkePathPrefix:         '',
      rkeWindowsPathPrefix:  '',
      systemDefaultRegistry: 'ghcr.io',
      systemProjectId:       'p-w2nhb',
      url:                   'https://example.com'
    },
    systemDefaultRegistry: 'ghcr.io'
  },
  telemetry: {
    metrics: true,
    sidecar: {
      tracing: {
        jaeger: {
          endpoint: 'my-open-telemetry-collector.jaeger.svc.cluster.local:4317',
          tls:      { insecure: true }
        }
      }
    },
    tracing: true
  }
};

export const mockControllerApp: CatalogApp = {
  ...mockControllerAppLegacy,
  spec: {
    chart: {
      metadata: {
        annotations: {
          'catalog.cattle.io/auto-install':        'kubewarden-crds=1.13.0',
          'catalog.cattle.io/certified':           'rancher',
          'catalog.cattle.io/display-name':        'Kubewarden',
          'catalog.cattle.io/namespace':           'cattle-kubewarden-system',
          'catalog.cattle.io/os':                  'linux',
          'catalog.cattle.io/provides-gvr':        'policyservers.policies.kubewarden.io/v1',
          'catalog.cattle.io/rancher-version':     '>= 2.6.0-0 <= 2.11.100-0',
          'catalog.cattle.io/release-name':        'rancher-kubewarden-controller',
          'catalog.cattle.io/requests-cpu':        '250m',
          'catalog.cattle.io/requests-memory':     '50Mi',
          'catalog.cattle.io/type':                'cluster-tool',
          'catalog.cattle.io/ui-component':        'kubewarden',
          'catalog.cattle.io/ui-source-repo':      'kubewarden-charts',
          'catalog.cattle.io/ui-source-repo-type': 'cluster',
          'catalog.cattle.io/upstream-version':    '4.1.0'
        },
        apiVersion:  'v2',
        appVersion:  'v1.21.0',
        description: 'A Helm chart for deploying the Kubewarden stack',
        home:        'https://www.kubewarden.io/',
        icon:        'https://www.kubewarden.io/images/icon-kubewarden.svg',
        keywords:    [
          'Kubewarden',
          'Security',
          'Infrastructure',
          'Monitoring',
          'policy agent',
          'policies',
          'validating webhook',
          'admissions controller',
          'policy report',
          'audit scanner'
        ],
        kubeVersion: '>= 1.19.0-0',
        maintainers: [
          {
            email: 'cncf-kubewarden-maintainers@lists.cncf.io',
            name:  'Kubewarden Maintainers',
            url:   'https://github.com/orgs/kubewarden/teams/maintainers'
          }
        ],
        name:    'kubewarden-controller',
        type:    'application',
        version: '4.1.0'
      }
    },
    name:      'rancher-kubewarden-controller',
    namespace: 'cattle-kubewarden-system',
  },
  values: { ...controllerAppValues }
};
