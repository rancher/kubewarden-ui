export interface JaegerConfig {
  store: any,
  queryService: any,
  resource?: any,
  relatedPolicies?: any,
  policy?: any,
  time?: any
}

export interface PolicyTrace {
  id: string,
  allowed: boolean,
  mode: string,
  name: string,
  operation: string,
  kind: string,
  namespace?: string,
  startTime: number,
  duration: number,
  responseMessage?: string,
  responseCode?: string | number,
  mutated?: string
}

export interface PolicyTraceConfig {
  policyName: string,
  cluster: string,
  traces: PolicyTrace[]
}

export interface Tag {
  key: string;
  type: string;
  value: string | number | boolean;
}
