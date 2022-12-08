import filter from 'lodash/filter';
import matches from 'lodash/matches';

import SteveModel from '@shell/plugins/steve/steve-class';
import { CONFIG_MAP, MANAGEMENT, SERVICE } from '@shell/config/types';
import { proxyUrlFromParts } from '@shell/models/service';
import { findBy, isArray } from '@shell/utils/array';
import { addParam } from '@shell/utils/url';

import { KUBEWARDEN, METRICS_DASHBOARD } from '../../types';
import policyServerDashboard from '../../assets/kubewarden-metrics-policyserver.json';
import policyDashboard from '../../assets/kubewarden-metrics-policy.json';

export const TRACE_HEADERS = [
  {
    name:  'operation',
    value: 'operation',
    label: 'Operation',
    sort:  'operation'
  },
  {
    name:  'mode',
    value: 'mode',
    label: 'Mode',
    sort:  'mode'
  },
  {
    name:  'kind',
    value: 'kind',
    label: 'Kind',
    sort:  'kind'
  },
  {
    name:  'name',
    value: 'name',
    label: 'Name',
    sort:  'name'
  },
  {
    name:  'namespace',
    value: 'namespace',
    label: 'Namespace',
    sort:  'namespace'
  },
  {
    name:  'startTime',
    value: 'startTime',
    label: 'Start Time',
    sort:  'startTime:desc'
  },
  {
    name:  'duration',
    value: 'duration',
    label: 'Duration (ms)',
    sort:  'duration'
  }
];

export const RULE_HEADERS = [
  {
    name:  'apiGroups',
    value: 'apiGroups',
    label: 'API Groups',
    sort:  'apiGroups'
  },
  {
    name:  'apiVersions',
    value: 'apiVersions',
    label: 'API Versions',
    sort:  'apiVersions'
  },
  {
    name:  'operations',
    value: 'operations',
    label: 'Operations',
    sort:  'operations'
  },
  {
    name:  'resources',
    value: 'resources',
    label: 'Resources',
    sort:  'resources'
  },
];

export const MODE_MAP = {
  monitor: 'bg-success',
  protect: 'bg-warning'
};

export const OPERATION_MAP = {
  '*':     'bg-darker',
  CREATE:  'bg-info',
  UPDATE:  'bg-warning',
  DELETE:  'bg-error',
  CONNECT: 'bg-success'
};

export const RANCHER_NAMESPACES = [
  'calico-system',
  'cattle-alerting',
  'cattle-fleet-local-system',
  'cattle-fleet-system',
  'cattle-global-data',
  'cattle-global-nt',
  'cattle-impersonation-system',
  'cattle-istio',
  'cattle-logging',
  'cattle-pipeline',
  'cattle-prometheus',
  'cattle-system',
  'cert-manager',
  'ingress-nginx',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'rancher-operator-system',
  'security-scan',
  'tigera-operator'
];

export const NAMESPACE_SELECTOR = {
  key:      'kubernetes.io/metadata.name',
  operator: 'NotIn',
  values:   RANCHER_NAMESPACES
};

export const ARTIFACTHUB_ENDPOINT = 'artifacthub.io/api/v1';

export const GRAFANA_DASHBOARD_ANNOTATIONS = {
  'meta.helm.sh/release-name':      'rancher-monitoring',
  'meta.helm.sh/release-namespace': 'cattle-monitoring-system'
};

export const GRAFANA_DASHBOARD_LABELS = {
  app:                            'rancher-monitoring-grafana',
  'app.kubernetes.io/instance':   'rancher-monitoring',
  'app.kubernetes.io/managed-by': 'Helm',
  'app.kubernetes.io/part-of':    'rancher-monitoring',
  'app.kubernetes.io/version':    '101.0.0_up19.0.3',
  chart:                          'rancher-monitoring-101.0.0_up19.0.3',
  grafana_dashboard:              '1',
  heritage:                       'Helm',
  release:                        'rancher-monitoring'
};

export const VALIDATION_KEYS = [
  'allowed',
  'host',
  'kind',
  'mutated',
  'name',
  'namespace',
  'operation',
  'policy_id',
  'response_message',
  'response_code'
];

export default class KubewardenModel extends SteveModel {
  async allServices() {
    const inStore = this.$rootGetters['currentProduct'].inStore;

    return await this.$dispatch(`${ inStore }/findAll`, { type: SERVICE }, { root: true });
  }

  get detailPageHeaderBadgeOverride() {
    return this.status?.policyStatus;
  }

  get componentForBadge() {
    if ( this.detailPageHeaderBadgeOverride ) {
      return require(`../../formatters/PolicyStatus.vue`).default;
    }

    return null;
  }

  get link() {
    if ( this.spec?.toURL ) {
      return this.spec.toURL;
    } else if ( this.spec?.toService ) {
      const s = this.spec.toService;

      return proxyUrlFromParts(this.$rootGetters['clusterId'], s.namespace, s.name, s.scheme, s.port, s.path);
    } else {
      return null;
    }
  }

  get whitelistSetting() {
    return this.$rootGetters['management/all'](MANAGEMENT.SETTING).find(s => s.id === 'whitelist-domain');
  }

  /*
    Fetches all of the packages from the kubewarden org
  */
  get artifactHubRepo() {
    return async() => {
      let url = '/meta/proxy/';
      const packages = 'packages/search';

      url += `${ ARTIFACTHUB_ENDPOINT }/${ packages }`;
      url = addParam(url, 'kind', '13');

      return await this.$dispatch('management/request', { url, redirectUnauthorized: false }, { root: true });
    };
  }

  /*
    Necessary for retrieving detailed package info
  */
  get artifactHubPackage() {
    return (pkg) => {
      try {
        const url = `/meta/proxy/${ ARTIFACTHUB_ENDPOINT }/packages/kubewarden/${ pkg.repository.name }/${ pkg.name }`;

        return this.$dispatch('management/request', { url, redirectUnauthorized: false }, { root: true });
      } catch (e) {
        console.warn(`Error fetching pkg: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get certManagerService() {
    return async() => {
      try {
        const all = await this.allServices();

        return all.find(s => s.metadata?.labels?.['app'] === 'cert-manager');
      } catch (e) {
        console.warn(`Error fetching cert-manager service: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get grafanaService() {
    return async() => {
      try {
        const services = await this.allServices();

        if ( services ) {
          const grafana = findBy(services, 'id', 'cattle-monitoring-system/rancher-monitoring-grafana');

          return grafana;
        }
      } catch (e) {
        console.warn(`Error getting Grafana service: ${ e }`); // eslint-disable-line no-console
      }
    };
  }

  get grafanaProxy() {
    return async(type) => {
      const dashboardName = type === METRICS_DASHBOARD.POLICY_SERVER ? 'kubewarden-policy-server' : 'kubewarden-policy';

      try {
        const grafana = await this.grafanaService();

        if ( grafana ) {
          return `${ grafana.proxyUrl('http', 80) }d/${ type }/${ dashboardName }?orgId=1&kiosk`;
        }
      } catch (e) {
        console.warn(`Error fetching Grafana proxy: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerService() {
    return async() => {
      try {
        const services = await this.allServices();

        if ( services ) {
          return services.find((s) => {
            const found = s.metadata?.labels?.['app'] === 'jaeger' && s.metadata?.labels?.['app.kubernetes.io/component'] === 'service-query';

            if ( found ) {
              return s;
            }
          });
        }
      } catch (e) {
        console.warn(`Error fetching services: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerValidations() {
    return async({ jaegerService, denied, time }) => {
      const lookbackTime = time || '2d';

      const traceTags = `tags={"allowed"%3A"false"}`;
      const proxyPath = `api/traces?service=kubewarden-policy-server&operation=validation&limit=1000&lookback=${ lookbackTime }`;

      if ( denied ) {
        proxyPath.concat('&', traceTags);
      }

      const url = `${ jaegerService?.proxyUrl('http', 16686) + proxyPath }`;

      return await this.$dispatch('request', { url });
    };
  }

  get jaegerSpecificValidations() {
    return async({ time, service }) => {
      try {
        const traceTypes = ['monitor', 'protect'];

        const promises = traceTypes.map((t) => {
          let proxyPath = null;

          const name = this.jaegerPolicyName;
          const lookbackTime = time || '2d';

          const options = `lookback=${ lookbackTime }&tags={"policy_id"%3A"${ name }"}`;
          const operation = t === 'monitor' ? 'policy_eval' : 'validation';

          proxyPath = `api/traces?service=kubewarden-policy-server&operation=${ operation }&${ options }`;

          const JAEGER_PATH = `${ service?.proxyUrl('http', 16686) + proxyPath }`;

          return this.$dispatch('request', { url: JAEGER_PATH });
        });

        let out = await Promise.all(promises);

        if ( out.length > 1 ) {
          out = [...new Set(out.flatMap(o => o.data))];
        }

        return out;
      } catch (e) {
        console.warn(`Error fetching Jaeger traces: ${ e }`); // eslint-disable-line no-console
      }

      return null;
    };
  }

  get jaegerPolicyName() {
    let out = null;

    switch (this.kind) {
    case 'ClusterAdmissionPolicy':
      out = `clusterwide-${ this.metadata?.name }`;
      break;

    case 'AdmissionPolicy':
      out = `namespaced-${ this.metadata?.namespace }-${ this.metadata?.name }`;
      break;

    default:
      break;
    }

    return out;
  }

  // Determines if a policy is targeting rancher specific namespaces (which happens by default)
  get namespaceSelector() {
    const rancherNs = RANCHER_NAMESPACES.find(ns => ns === this.metadata?.namespace);
    const selector = filter(this.spec?.namespaceSelector?.matchExpressions, matches(NAMESPACE_SELECTOR));

    if ( rancherNs || !selector ) {
      return true;
    }

    return false;
  }

  get policyTypes() {
    const out = Object.values(KUBEWARDEN.SPOOFED);

    return out;
  }

  get policyQuestions() {
    return async() => {
      const module = this.spec.module;

      const found = this.policyTypes.find((t) => {
        if ( module.includes( t.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '') ) ) {
          return t;
        }
      });

      // Spoofing the questions object from hard-typed questions json for each policy
      if ( found ) {
        const short = found.replace(`${ KUBEWARDEN.SPOOFED.POLICIES }.`, '');
        const json = (await import(/* webpackChunkName: "policy-questions" */`../../questions/policy-questions/${ short }.json`)).default;

        return json;
      }

      return null;
    };
  }

  async addGrafanaDashboard(type) {
    /*
      There are 2 dashboards for Kubewarden:
      - PolicyServer is the default one copied from https://grafana.com/grafana/dashboards/15314-kubewarden/
      - Policies have a condensed version
    */
    const dashboard = type === METRICS_DASHBOARD.POLICY_SERVER ? policyServerDashboard : policyDashboard;
    const fileKey = `${ type }.json`;

    const configMapTemplate = await this.$dispatch('cluster/create', {
      type:       CONFIG_MAP,
      metadata: {
        annotations: GRAFANA_DASHBOARD_ANNOTATIONS,
        labels:      GRAFANA_DASHBOARD_LABELS,
        name:        type,
        namespace:   'cattle-dashboards'
      },
      data: { [fileKey]: JSON.stringify(dashboard) },
    }, { root: true });

    try {
      await configMapTemplate.save();
    } catch (e) {
      console.warn(`Error creating dashboard configmap: ${ e }`); // eslint-disable-line no-console
    }
  }

  haveComponent(name) {
    try {
      require.resolve(`../../chart/${ name }`);

      return true;
    } catch (e) {
      return false;
    }
  }

  importComponent(name) {
    if ( !name ) {
      throw new Error('Name required');
    }

    return () => import(/* webpackChunkName: "chart" */ `../../chart/${ name }`);
  }

  traceTableRows(traces) {
    let traceArray = [];

    // If a policy is in monitor mode it will pass multiple trace objects
    if ( isArray(traces) ) {
      traceArray = [...new Map(traces.map(trace => [trace['traceID'], trace])).values()];
    } else {
      Object.assign(traceArray, traces?.data);
    }

    const out = traceArray.flatMap((trace) => {
      const eSpan = trace.spans?.find(s => s.operationName === 'policy_eval'); // policy in Monitor mode evaluation span
      const vSpan = trace.spans?.find(s => s.operationName === 'validation'); // policy in Protect mode validation span

      if ( vSpan ) {
        const date = new Date(vSpan.startTime / 1000);
        const duration = vSpan.duration / 1000;

        vSpan.startTime = date.toUTCString();
        vSpan.duration = duration.toFixed(2);

        const logs = {};
        let mode = 'protect'; // defaults to Protect mode for "Mode" trace header

        // 'policy_eval' logs will only exist when a policy is in monitor mode
        if ( eSpan.logs.length > 0 ) {
          mode = 'monitor';

          const fields = eSpan.logs.flatMap(log => log.fields);

          fields.map((f) => {
            if ( f.key === 'response' ) {
              Object.assign(logs, { [f.key]: f.value });
            }
          });
        }

        const tags = VALIDATION_KEYS.map(vKey => vSpan.tags.find(tag => tag.key === vKey));

        return tags?.reduce((tag, item) => ({
          ...vSpan, ...tag, [item?.key]: item?.value, mode, logs
        }), {});
      }

      return null;
    });

    return [...new Set(out)];
  }

  updateWhitelist(url, remove) {
    const whitelist = this.whitelistSetting;
    const whitelistValue = whitelist?.value.split(',');

    if ( remove && whitelistValue.includes(url) ) {
      const out = whitelistValue.filter(domain => domain !== url);

      whitelist.default = out.join();
      whitelist.value = out.join();

      try {
        return whitelist.save();
      } catch (e) {}
    }

    if ( !whitelistValue.includes(url) ) {
      whitelistValue.push(url);

      whitelist.default = whitelistValue.join();
      whitelist.value = whitelistValue.join();

      try {
        return whitelist.save();
      } catch (e) {}
    }
  }
}

export function colorForStatus(status) {
  switch ( status ) {
  case 'unschedulable':
    return 'text-error';
  case 'pending':
    return 'text-info';
  case 'active':
    return 'text-success';
  default:
    break;
  }

  return 'text-warning'; // 'unscheduled' is the default state
}

export function stateSort(color, display) {
  const SORT_ORDER = {
    error:    1,
    warning:  2,
    info:     3,
    success:  4,
    ready:    5,
    notready: 6,
    other:    7,
  };

  color = color.replace(/^(text|bg)-/, '');

  return `${ SORT_ORDER[color] || SORT_ORDER['other'] } ${ display }`;
}

export function colorForTraceStatus(status) {
  switch ( status ) {
  case 'allowed':
    return 'success';
  case 'denied':
    return 'error';
  case 'mutated':
    return 'warning';
  default:
    break;
  }

  return 'success'; // 'unscheduled' is the default state
}
