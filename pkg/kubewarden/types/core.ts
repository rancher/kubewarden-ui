import { V1ObjectMeta } from '@kubernetes/client-node';

export interface Label { [key: string]: string; }

export interface Links {
  remove?: string;
  self?: string;
  update?: string;
  view?: string;
}

export interface Route {
  name: string;
  params: {
    resource?: string;
    product?: string;
    cluster?: string;
    hash?: string;
  }
}

export interface Condition {
  error: boolean,
  lastTransitionTime?: string,
  lastUpdateTime?: string,
  message?: string,
  reason?: string,
  status: string,
  transitioning: boolean,
  type: string
}

export interface State {
  error?: boolean,
  message?: string,
  name?: string,
  transitioning?: boolean
}

export interface Relationship {
  fromId: string,
  fromType: string,
  rel: string,
  state: string
}

export interface ApiGroup {
  id: string,
  type: string,
  links: {
    self: string
  },
  versions?: [
    {
      groupVersion: string,
      version: string,
    }
  ],
  preferredVersion?: {
    groupVersion: string,
    version: string
  }
}

export interface CustomResourceDefinition {
  apiVersion: string,
  kind: string,
  metadata: V1ObjectMeta,
  spec: {
    conversion: {
      strategy: string,
    },
    group: string,
    names: {
      kind: string,
      listKind?: string,
      plural: string,
      singular: string,
    },
    scope?: string,
    versions?: [
      {
        additionalPrinterColumns?: [
          {
            description: string,
            jsonPath: string,
            name: string,
            type: string,
          }
        ],
        name: string,
        schema: any,
        served?: boolean,
        storage?: boolean,
        subresources?: {
          status: object
        }
      }
    ]
  },
  status?: {
    acceptedNames?: {
      kind: string,
      listKind: string,
      plural: string,
      singular: string,
    },
    conditions?: Array<Condition>,
    storedVersions?: string[]
  }
}
