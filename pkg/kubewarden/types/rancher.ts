import { V1Deployment, V1ObjectMeta } from "@kubernetes/client-node"

export type ResourceField = {
  type: string,
  nullable: boolean,
  create: boolean,
  required?: boolean,
  update: boolean,
  description: string
}

export type AttributeColumn = {
  name: string,
  type: string,
  format: string,
  description: string,
  priority: number,
  field: string
}

export type Schema = {
  id: string,
  type: string,
  links: {
    collection?: string,
    self: string,
  },
  description: string,
  pluralName?: string,
  resourceMethods?: string[],
  resourceFields?: {
    apiVersion: ResourceField,
    kind: ResourceField,
    metadata: ResourceField,
    spec: ResourceField,
    status: ResourceField
  },
  collectionMethods?: string[],
  attributes?: {
    columns: AttributeColumn[],
    group: string,
    kind: string,
    namespaced?: boolean,
    resource?: string,
    verbs: string[],
    version: string,
  },
  _id: string,
  _group: string,
  linkFor: (id: string) => string,
}

export const PROJECT = { APP: 'project.cattle.io.app' };

export interface Deployment extends V1Deployment {
  metadata: V1ObjectMeta &{
    state: {
      error: boolean,
      message: string,
      name: string,
      transitioning: boolean
    }
  }
}