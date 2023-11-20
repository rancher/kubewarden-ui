import { State } from './core';

export interface CatalogApp {
  id: string,
  type: string,
  links?: {
    remove?: string,
    self?: string,
    update?: string,
    view?: string,
  },
  actions?: {
    uninstall: string,
  },
  apiVersion: string,
  kind: string,
  metadata: {
    annotations?: {[key: string]: string},
    labels?: {[key: string]: string},
    name: string,
    namespace: string,
    state: State,
  },
  spec: {
    chart: {
      metadata: {
        annotations?: {[key: string]: string},
        apiVersion?: string,
        appVersion?: string,
        name?: string,
        type?: string,
        version?: string,
      },
      values?: any
    },
    info?: {
      status: string,
    },
    name: string,
    namespace: string,
    values?: any,
  }
  status?: {
    summary?: {
      state?: string,
    }
  }
}