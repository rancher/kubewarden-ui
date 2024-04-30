import isEmpty from 'lodash/isEmpty';

import { SCHEMA } from '@shell/config/types';

import { ApiGroup, Schema } from '../types';

/**
 * To find the `type` of a resource that does not have the `group` listed, this
 * will split the `apiVersion` and concatenate it with the `kind`.
 * @param resource | Any resource with the `apiVersion` and `kind` properties
 * @returns `string | void` | Group type (e.g. `apps.deployment`)
 */
export function splitGroupKind(resource: any): string | void {
  const loweredKind = resource?.kind?.toLowerCase();
  const group = resource?.apiVersion?.split('/')[0];

  if ( loweredKind && group ) {
    return `${ group }.${ loweredKind }`;
  }
}

/**
 * Find the schemas for a supplied `apiGroup`.
 * @param store
 * @param group: `ApiGroup | string` | Can either be a full apiGroup resource or the group id.
 * @returns `Schema[]`
 */
export function schemasForGroup(store: any, group: ApiGroup | string): Schema[] {
  const schemas: Schema[] = store?.getters['cluster/all'](SCHEMA) || [];

  if ( isEmpty(schemas) || isEmpty(group) ) {
    return [];
  }

  return schemas.filter((schema) => {
    if ( typeof group === 'string' ) {
      return schema._group === group;
    }

    return schema._group === group.id;
  });
}

/**
 * Filters supplied apiGroups that contain `namespaced` resources.
 * @param store
 * @param apiGroups `ApiGroup[]`
 * @returns `ApiGroup[]`
 */
export function namespacedGroups(store: any, apiGroups: ApiGroup[]): ApiGroup[] | void {
  const schemas: Schema[] = store?.getters['cluster/all'](SCHEMA);

  if ( isEmpty(schemas) || isEmpty(apiGroups) ) {
    return;
  }

  return apiGroups.reduce((filteredGroups: ApiGroup[], group: ApiGroup) => {
    const filteredSchemas: Schema[] = schemasForGroup(store, group);

    const out = filteredSchemas?.some(schema => !(schema?.attributes?.namespaced === false || undefined));

    if ( out || group.id === 'core' ) {
      filteredGroups.push(group);
    }

    return filteredGroups;
  }, []);
}

/**
 * Filteres supplied schemas with `namespaced` resources.
 * @param schemas `Schema[]`
 * @returns `Schema[] | void`
 */
export function namespacedSchemas(schemas: Schema[]): Schema[] | void {
  return schemas?.filter(schema => !(schema?.attributes?.namespaced === false || undefined));
}

/**
 * Determines if a Kubernetes resource is namespaced based on its metadata.
 * @param resource The Kubernetes resource object.
 * @returns boolean indicating if the resource is namespaced.
 */
export function isResourceNamespaced(resource: any): boolean {
  return 'namespace' in resource.metadata;
}