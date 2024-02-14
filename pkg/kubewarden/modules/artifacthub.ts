import { ArtifactHubPackage } from '../types';

/**
 * Extracts resource kinds from a list of ArtifactHub packages with the `kubewarden/resources` annotation.
 * @param artifactHubPackages
 * @returns `string[]` | Resource kinds
 */
export function resourcesFromAnnotation(artifactHubPackages: ArtifactHubPackage[]): string[] | void {
  const out: string[] = [];

  const resources = artifactHubPackages?.flatMap((artifactHubPackage) => {
    const annotation = artifactHubPackage?.data?.['kubewarden/resources'];

    if ( annotation ) {
      return annotation;
    }
  });

  resources?.flatMap((resource) => {
    if ( resource ) {
      const split = resource.split(',');

      if ( split.length > 1 ) {
        split.forEach((s: string) => out.push(s.trim()));
      } else {
        out.push(resource);
      }
    }

    return [];
  })?.sort();

  if ( !out || out?.length === 0 ) {
    return [];
  }

  return [...new Set(out.filter(Boolean))];
}

/**
 * Checks the resources within a ArtifactHub package's `kubewarden/resources` annotation to determine if
 * the policy is targeting non-namespaced resources. Needed to gate CAP from AP grid.
 * @param artifactHubPackage `schemas`
 * @returns Boolean
 */
export function isGlobalPolicy(artifactHubPackage: ArtifactHubPackage, schemas: any): Boolean {
  if ( artifactHubPackage ) {
    const resources: string[] | undefined = artifactHubPackage.data?.['kubewarden/resources']?.split(',');
    let targetsNonNamespaced: Boolean = false;

    if ( resources ) {
      for ( const resource of resources ) {
        targetsNonNamespaced = schemas?.some((schema: any) => (
          schema?.attributes?.kind === resource && (schema?.attributes?.namespaced === false || undefined)
        ));
      }
    }

    return targetsNonNamespaced;
  }

  return false;
}
