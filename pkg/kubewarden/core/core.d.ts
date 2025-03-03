declare module 'core' {
  type CoreResource = {
    id: string;
    attributes: {
      group: string;
      kind: string;
      resource: string;
      namespaced: boolean;
    }
  };

  export type Pod = CoreResource;
  export type Service = CoreResource;
  export type ReplicationController = CoreResource;
  export type Secret = CoreResource;
  export type ConfigMap = CoreResource;
  export type Namespace = CoreResource;
  export type Event = CoreResource;
  export type Node = CoreResource;
  export type PersistentVolume = CoreResource;
  export type PersistentVolumeClaim = CoreResource;
}
