import { State } from './core';

export type Port ={
  name?: string,
  port?: number,
  protocol?: string,
  targetPort?: number
}

export interface Service {
  id: string,
  type: string,
  links?: {
    remove?: string,
    self?: string,
    update?: string,
    view?: string,
  },
  apiVersion: string,
  kind: string,
  metadata: {
    labels: {[key: string]: string},
    name: string,
    namespace: string,
    state?: State,
  },
  spec: {
    clusterIP?: string,
    clusterIPs?: string[],
    internalTrafficPolicy?: string,
    ipFamilies?: string[],
    ipFamilyPolicy?: string,
    ports?: Port[],
    selector?: {[key: string]: string},
    sessionAffinity?: string,
    type?: string,
  },
  status?: { loadBalancer?: any }
}