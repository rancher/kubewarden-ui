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