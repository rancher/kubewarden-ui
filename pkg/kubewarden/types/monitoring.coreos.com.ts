import { V1ObjectMeta, V1LabelSelector } from '@kubernetes/client-node';

/**
 * ServiceMonitor is the custom resource definition (CRD) that defines how Prometheus
 * and PrometheusAgent scrape metrics from a group of services.
 */
export interface ServiceMonitor {
  apiVersion: 'monitoring.coreos.com/v1';
  kind: 'ServiceMonitor';
  metadata: V1ObjectMeta;
  spec: ServiceMonitorSpec;
  type?: string; // This is not part of the CRD, it's added by Rancher
}

/**
 * ServiceMonitorSpec defines the desired Service selection for target discovery by Prometheus.
 */
export interface ServiceMonitorSpec {
  jobLabel?: string;
  targetLabels?: string[];
  podTargetLabels?: string[];
  endpoints: Endpoint[];
  selector: V1LabelSelector;
  selectorMechanism?: SelectorMechanism;
  namespaceSelector?: NamespaceSelector;
  sampleLimit?: number;
  scrapeProtocols?: ScrapeProtocol[];
  fallbackScrapeProtocol?: ScrapeProtocol;
  targetLimit?: number;
  labelLimit?: number;
  labelNameLengthLimit?: number;
  labelValueLengthLimit?: number;
  scrapeClassicHistograms?: boolean;
  nativeHistogramBucketLimit?: number;
  nativeHistogramMinBucketFactor?: string;
  keepDroppedTargets?: number;
  attachMetadata?: AttachMetadata;
  scrapeClass?: string;
  bodySizeLimit?: ByteSize;
}

/**
 * Endpoint defines how to scrape metrics from Kubernetes Endpoints objects.
 */
export interface Endpoint {
  port?: string;
  interval?: string;
  path?: string;
  scheme?: string;
  tlsConfig?: TLSConfig;
  bearerTokenFile?: string;
  params?: { [key: string]: string[] };
  honorLabels?: boolean;
  metricRelabelings?: any[];
  relabelings?: any[];
}

/**
 * TLSConfig provides the TLS configuration for secure communication.
 */
export interface TLSConfig {
  caFile?: string;
  certFile?: string;
  keyFile?: string;
  serverName?: string;
  insecureSkipVerify?: boolean;
}

/**
 * SelectorMechanism defines the mechanism used to select endpoints.
 */
export type SelectorMechanism = 'label' | 'role';

/**
 * NamespaceSelector defines in which namespaces Prometheus should discover the services.
 */
export interface NamespaceSelector {
  any?: boolean;
  matchNames?: string[];
}

/**
 * ScrapeProtocol defines the protocol used during scraping.
 */
export type ScrapeProtocol = 'http' | 'https';

/**
 * AttachMetadata defines additional metadata to add to discovered targets.
 * You can expand this interface based on further documentation.
 */
export interface AttachMetadata {
  labels?: string[];
  annotations?: string[];
}

/**
 * ByteSize is a type alias for representing size limits.
 * Typically sizes are provided as strings (e.g., "10Mi").
 */
export type ByteSize = string;
