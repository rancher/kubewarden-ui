import { PolicyChart, KUBEWARDEN_POLICY_ANNOTATIONS, LEGACY_POLICY_ANNOTATIONS } from '../types';

/**
 * Extracts resource kinds from a list of policy charts with the `kubewarden/resources` annotation.
 * @param policyCharts
 * @returns `string[]` | Resource kinds
 */
export function resourcesFromAnnotation(policyChart: PolicyChart[]): string[] | void {
  const out: string[] = [];

  const resources = policyChart?.flatMap((policyChart) => {
    const annotation = policyChart?.annotations?.[KUBEWARDEN_POLICY_ANNOTATIONS.RESOURCES] ??
                       policyChart?.annotations?.[LEGACY_POLICY_ANNOTATIONS.RESOURCES];

    if (annotation) {
      return annotation;
    }
  });

  resources?.flatMap((resource) => {
    if (resource) {
      const split = resource.split(',');

      if (split.length > 1) {
        split.forEach((s: string) => out.push(s.trim()));
      } else {
        out.push(resource);
      }
    }

    return [];
  })?.sort();

  if (!out || out?.length === 0) {
    return [];
  }

  return [...new Set(out.filter(Boolean))];
}

/**
 * Checks the resources within a policy chart's `kubewarden/resources` annotation to determine if
 * the policy is targeting non-namespaced resources. Needed to gate CAP from AP grid.
 * @param policyChart `schemas`
 * @returns Boolean
 */
export function isGlobalPolicy(policyChart: PolicyChart, schemas: any): Boolean {
  if (policyChart) {
    const resources: string[] | undefined = policyChart.annotations?.['kubewarden/resources']?.split(',');
    let targetsNonNamespaced: Boolean = false;

    if (resources) {
      for (const resource of resources) {
        targetsNonNamespaced = schemas?.some((schema: any) => (
          schema?.attributes?.kind === resource && (schema?.attributes?.namespaced === false || undefined)
        ));
      }
    }

    return targetsNonNamespaced;
  }

  return false;
}
