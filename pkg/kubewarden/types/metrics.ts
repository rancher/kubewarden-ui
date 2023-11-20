type Endpoint = {
  interval: string,
  port: string
}

export interface ServiceMonitorSpec {
  endpoints?: Endpoint[],
  name?: string,
  namespaceSelector?: {
    matchNames?: string[]
  },
  selector?: {
    matchLabels?: {[key: string]: string}
  }
}

export interface ServiceMonitor {
  apiVersion?: string,
  kind?: string,
  metadata: {
    name: string
    namespace: string
  },
  spec: ServiceMonitorSpec,
  type?: string
}
