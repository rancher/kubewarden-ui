import * as core from 'core';

export const pod: core.Pod = {
  id:         'pod',
  attributes: {
    group:      'core',
    kind:       'Pod',
    resource:   'pods',
    namespaced: true
  }
};

export const service: core.Service = {
  id:         'service',
  attributes: {
    group:      'core',
    kind:       'Service',
    resource:   'services',
    namespaced: true
  }
};

export const replicationController: core.ReplicationController = {
  id:         'replicationcontroller',
  attributes: {
    group:      'core',
    kind:       'ReplicationController',
    resource:   'replicationcontrollers',
    namespaced: true
  }
};

export const secret: core.Secret = {
  id:         'secret',
  attributes: {
    group:      'core',
    kind:       'Secret',
    resource:   'secrets',
    namespaced: true
  }
};

export const configMap: core.ConfigMap = {
  id:         'configmap',
  attributes: {
    group:      'core',
    kind:       'ConfigMap',
    resource:   'configmaps',
    namespaced: true
  }
};

export const namespace: core.Namespace = {
  id:         'namespace',
  attributes: {
    group:      'core',
    kind:       'Namespace',
    resource:   'namespaces',
    namespaced: false
  }
};

export const event: core.Event = {
  id:         'event',
  attributes: {
    group:      'core',
    kind:       'Event',
    resource:   'events',
    namespaced: true
  }
};

export const node: core.Node = {
  id:         'node',
  attributes: {
    group:      'core',
    kind:       'Node',
    resource:   'nodes',
    namespaced: false
  }
};

export const persistentVolume: core.PersistentVolume = {
  id:         'persistentvolume',
  attributes: {
    group:      'core',
    kind:       'PersistentVolume',
    resource:   'persistentvolumes',
    namespaced: false
  }
};

export const persistentVolumeClaim: core.PersistentVolumeClaim = {
  id:         'persistentvolumeclaim',
  attributes: {
    group:      'core',
    kind:       'PersistentVolumeClaim',
    resource:   'persistentvolumeclaims',
    namespaced: true
  }
};
