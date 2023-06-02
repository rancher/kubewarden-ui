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

  export interface Pod extends CoreResource {}
  export interface Service extends CoreResource {}
  export interface ReplicationController extends CoreResource {}
  export interface Secret extends CoreResource {}
  export interface ConfigMap extends CoreResource {}
  export interface Namespace extends CoreResource {}
  export interface Event extends CoreResource {}
  export interface Node extends CoreResource {}
  export interface PersistentVolume extends CoreResource {}
  export interface PersistentVolumeClaim extends CoreResource {}
}
