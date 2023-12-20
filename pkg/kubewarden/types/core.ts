export type Label = { [key: string]: string };

export type Links = {
  remove?: string;
  self?: string;
  update?: string;
  view?: string;
}

export type Route = {
  name: string;
  params: {
    resource?: string;
    product?: string;
    cluster?: string;
    hash?: string;
  }
}

export type Condition = {
  error: boolean,
  lastTransitionTime?: string,
  lastUpdateTime?: string,
  message?: string,
  reason?: string,
  status: string,
  transitioning: boolean,
  type: string
}

export type State = {
  error?: boolean,
  message?: string,
  name?: string,
  transitioning?: boolean
}

export type Relationship = {
  fromId: string,
  fromType: string,
  rel: string,
  state: string
}

export type MatchExpression = {
  key: string,
  operator: string,
  values: string[]
}

export type Selector = {
  matchExpressions?: MatchExpression[],
  matchLabels?: Label
}

export type Metadata = {
  annotations?: {[key: string]: string},
  creationTimestamp: string;
  fields?: Array<string>;
  generation?: number;
  labels?: {[key: string]: string}
  name: string;
  namespace?: string;
  relationships?: Array<Relationship>;
  resourceVersion?: string;
  state?: State;
  uid: string;
}

export type ApiGroup = {
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

export type CustomResourceDefinition = {
  apiVersion: string,
  kind: string,
  metadata: Metadata,
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
          status: {}
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