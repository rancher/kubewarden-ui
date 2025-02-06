export interface ClusterRepo {
  apiVersion: string;
  kind: string;
  metadata: {
    creationTimestamp?: string;
    fields?: [
      string,
      string,
      null,
      null,
      null,
      string
    ],
    generation?: number;
    name: string;
    relationships?: [
      {
        toId: string,
        toType: string,
        rel: string,
        state: string,
        message: string
      }
    ],
    resourceVersion?: string;
    state?: {
      error: boolean;
      message: string;
      name: string;
      transitioning: boolean
    },
    uid: string;
  },
  spec: {
    forceUpdate?: string;
    url?: string;
  },
  status?: {
    conditions: [
      {
        error: boolean;
        lastUpdateTime: string;
        status: string;
        transitioning: boolean;
        type: string;
      }
    ],
    downloadTime: string;
    indexConfigMapName: string;
    indexConfigMapNamespace: string;
    observedGeneration: number;
    url: string;
  }
}