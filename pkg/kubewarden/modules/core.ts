import isEmpty from 'lodash/isEmpty';

import { SCHEMA } from '@shell/config/types';

/**
 * To find the `type` of a resource that does not have the `group` listed, this
 * will split the `apiVersion` and concatenate it with the `kind`.
 * @param resource | Any resource with the `apiVersion` and `kind` properties
 * @returns `string | void` | Group type (e.g. `apps.deployment`)
 */
export function splitGroupKind(resource: any): string | void {
  const loweredKind = resource.kind?.toLowerCase();
  const group = resource.apiVersion?.split('/')[0];

  if ( loweredKind && group ) {
    return `${ group }.${ loweredKind }`;
  }
}

export function namespacedGroups(store: any, apiGroups: any): any {
  const schemas = store?.getters['cluster/all'](SCHEMA);

  if ( !isEmpty(schemas) && !isEmpty(apiGroups) ) {
    return schemas?.filter((schema: any) => {
      let isNamespaced: Boolean = false;

      for ( const group of apiGroups ) {
        isNamespaced = schema?._group === group.id && !!(schema?.attributes?.namespaced === false || undefined);
      }

      if ( isNamespaced ) {
        return schema;
      }
    }

    );
  }

  return false;
}