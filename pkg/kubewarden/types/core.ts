export type Metadata = {
  creationTimestamp: string;
  fields?: Array<string>;
  generation?: number;
  labels?: {[key: string]: string}
  name: string;
  namespace?: string;
  relationships?: any;
  resourceVersion?: string;
  state?: {
    error?: boolean;
    message?: string;
    name?: string;
    transitioning?: boolean;
  };
  uid: string;
}

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