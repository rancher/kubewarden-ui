import {
  ServiceMonitor, ServiceMonitorSpec, CatalogApp, Service, PolicyServer, Policy
} from '@kubewarden/types';

export type ServiceMonitorConfigured = {
  namespace: boolean,
  selectors?: {[key: string]: boolean}[];
}

export interface MonitoringConfig {
  serviceMonitorSpec: ServiceMonitorSpec[],
  controllerApp: CatalogApp,
  policyServerSvcs: Service[]
}

export interface ServiceMonitorConfig {
  store: any,
  policyObj?: Policy,
  policyServerObj?: PolicyServer,
  controllerNs: string,
  allServiceMonitors?: ServiceMonitor[]
  serviceMonitor?: ServiceMonitor
}
