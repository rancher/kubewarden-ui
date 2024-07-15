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
}

export const PROJECT = { APP: 'project.cattle.io.app' };