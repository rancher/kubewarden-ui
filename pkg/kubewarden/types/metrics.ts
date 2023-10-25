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