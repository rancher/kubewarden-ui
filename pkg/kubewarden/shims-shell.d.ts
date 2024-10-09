declare module '@shell/utils/object' {
  export function get(obj: any, path: string, defaultValue?: any): any;
  export function isEqual(value: any, other: any): boolean;
}

declare module '@shell/config/types' {
  export const NAMESPACE: string;
  export const POD: string;
  export const INGRESS: string;
  export const SERVICE: string;
  export const SCHEMA: string;
  export const CONFIG_MAP: string;
  export const WORKLOAD_TYPES: {
    DEPLOYMENT: string;
    CRON_JOB: string;
    DAEMON_SET: string;
    JOB: string;
    STATEFUL_SET: string;
    REPLICA_SET: string;
    REPLICATION_CONTROLLER: string;
  };
  export const CATALOG: {
    CLUSTER_REPO: string;
    OPERATION: string;
    APP: string;
    REPO: string;
  };
  export const MONITORING: {
    ALERTMANAGER: string;
    ALERTMANAGERCONFIG: string;
    PODMONITOR: string;
    PROMETHEUS: string;
    PROMETHEUSRULE: string;
    SERVICEMONITOR: string;
    THANOSRULER: string;
    SPOOFED: {
      RECEIVER: string;
      RECEIVER_SPEC: string;
      RECEIVER_EMAIL: string;
      RECEIVER_SLACK: string;
      RECEIVER_WEBHOOK: string;
      RECEIVER_PAGERDUTY: string;
      RECEIVER_OPSGENIE: string;
      RECEIVER_HTTP_CONFIG: string;
      RESPONDER: string;
      ROUTE: string;
      ROUTE_SPEC: string;
    }
  };
  export const MANAGEMENT: {
    AUTH_CONFIG: string;
    CATALOG_TEMPLATE: string;
    CLUSTER: string;
    CLUSTER_ROLE_TEMPLATE_BINDING: string;
    FEATURE: string;
    KONTAINER_DRIVER: string;
    MULTI_CLUSTER_APP: string;
    NODE: string;
    NODE_DRIVER: string;
    NODE_POOL: string;
    NODE_TEMPLATE: string;
    PROJECT: string;
    PROJECT_ROLE_TEMPLATE_BINDING: string;
    ROLE_TEMPLATE: string;
    SETTING: string;
    USER: string;
    TOKEN: string;
    GLOBAL_ROLE: string;
    GLOBAL_ROLE_BINDING: string;
    PSA: string;
    MANAGED_CHART: string;
    USER_NOTIFICATION: string;
    GLOBAL_DNS_PROVIDER: string;
    RKE_TEMPLATE: string;
    RKE_TEMPLATE_REVISION: string;
    CLUSTER_PROXY_CONFIG: string;
  }
}

declare module '@shell/config/table-headers' {
  export const NAME: {
    name: string;
    labelKey: string;
    value: string;
    getValue: () => any;
    sort: string[];
    formatter: string;
    canBeVariable: boolean;
  }
}

declare module '@shell/config/labels-annotations' {
  export const FLEET: {
    CLUSTER_DISPLAY_NAME: string;
    CLUSTER_NAME: string;
    BUNDLE_ID: string;
    MANAGED: string;
    CLUSTER: string;
  }
  export const CATALOG: {
    CERTIFIED: string;
    _RANCHER: string;
    _PARTNER: string;
    _OTHER: string;

    EXPERIMENTAL: string;
    NAMESPACE: string;
    RELEASE_NAME: string;
    FEATURED: string;

    REQUIRES_GVK: string;
    PROVIDES: string;
    AUTO_INSTALL_GVK: string;
    AUTO_INSTALL: string;
    HIDDEN: string;
    REQUESTS_CPU: string;
    REQUESTS_MEMORY: string;

    SCOPE: string;
    _MANAGEMENT: string;
    _DOWNSTREAM: string;

    TYPE: string
    _APP: string
    _CLUSTER_TPL: string
    _CLUSTER_TOOL: string

    COMPONENT: string;
    SOURCE_REPO_TYPE: string;
    SOURCE_REPO_NAME: string;
    COLOR: string;
    DISPLAY_NAME: string;

    SUPPORTED_OS: string;
    PERMITTED_OS: string;
    DEPLOYED_OS: string;

    MIGRATED: string;
    MANAGED: string;

    HIDDEN_REPO: string;
  };
}

declare module '@shell/store/prefs' {
  export const SHOW_PRE_RELEASE: any;
}

declare module '@shell/utils/string' {
  export function randomStr(length?: number, chars?: string): string;
}

// Catch-all for any other modules under @shell/*
declare module '@shell/*' {
  const content: any;
  export default content;
}
