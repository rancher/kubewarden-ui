export interface ClusterRepo {
  id: string
  type: string
  links: Links
  actions: Actions
  apiVersion: string
  kind: string
  metadata: Metadata
  spec: Spec
  status: Status
}

interface Links {
  chart: string
  icon: string
  index: string
  info: string
  remove: string
  self: string
  update: string
  view: string
}

interface Actions {
  install: string
  upgrade: string
}

interface Metadata {
  creationTimestamp?: string
  fields?: string[] | undefined[]
  generation?: number
  managedFields?: ManagedField[]
  name: string
  relationships?: Relationship[]
  resourceVersion?: string
  state?: State
  uid: string
}

interface ManagedField {
  apiVersion: string
  fieldsType: string
  fieldsV1: any
  manager: string
  operation: string
  time: string
  subresource?: string
}


interface Relationship {
  toId: string
  toType: string
  rel: string
  state: string
  message: string
}

interface State {
  error: boolean
  message: string
  name: string
  transitioning: boolean
}

interface Spec {
  url: string
}

interface Status {
  conditions: Condition[]
  downloadTime: string
  indexConfigMapName: string
  indexConfigMapNamespace: string
  observedGeneration: number
  url: string
}

interface Condition {
  error: boolean
  lastUpdateTime: string
  status: string
  transitioning: boolean
  type: string
}
