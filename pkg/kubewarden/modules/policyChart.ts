import {
  PolicyChart, VersionInfo,
  KUBEWARDEN_CATALOG_ANNOTATIONS, KUBEWARDEN_POLICY_ANNOTATIONS, LEGACY_POLICY_ANNOTATIONS
} from '@kubewarden/types';

export interface PolicyModuleInfo {
  registry:   string;
  repository: string;
  tag:        string;
  source:     'values' | 'annotations';
}

export interface ParsedPolicyModule {
  registry:   string;
  repository: string;
  tag:        string;
}

/**

 * Matches a full OCI reference: [registry/]repository:tag
 * Capture group 1 = registry (optional), group 2 = repository, group 3 = tag.
 */
const OCI_REF_RE = /^(?:((?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(?::\d+)?|localhost(?::\d+)?)\/)?((?:[^:]+\/)*[^:/]+):([^:/]+)$/;

/**
 * Extracts OCI module info from a policy's VersionInfo.
 * Checks values.yaml first then falls back to Chart.yaml annotations (legacy format)
 */
export function parsePolicyModule(versionInfo: VersionInfo): PolicyModuleInfo | null {
  const values      = versionInfo?.values;
  const annotations = versionInfo?.chart?.annotations;

  // New format: values.yaml ships module.repository (pure path, no registry prefix) + module.tag.
  // The registry is always at global.cattle.systemDefaultRegistry.
  if (values?.module?.repository && values?.module?.tag) {
    return {
      registry:   values?.global?.cattle?.systemDefaultRegistry || '',
      repository: values.module.repository as string,
      tag:        values.module.tag as string,
      source:     'values',
    };
  }

  // Legacy format: Chart.yaml annotations
  if (annotations?.[KUBEWARDEN_CATALOG_ANNOTATIONS.REPOSITORY] && annotations?.[KUBEWARDEN_CATALOG_ANNOTATIONS.TAG]) {
    return {
      registry:   annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REGISTRY] || '',
      repository: annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.REPOSITORY],
      tag:        annotations[KUBEWARDEN_CATALOG_ANNOTATIONS.TAG],
      source:     'annotations',
    };
  }

  return null;
}

/**
 * Assembles the full OCI module string: "[registry/]repository:tag"
 */
export function buildModuleString(registry: string, repository: string, tag: string): string {
  const base = `${ repository }:${ tag }`;

  return registry ? `${ registry }/${ base }` : base;
}

/**
 * Splits a persisted OCI module string into registry, repository and tag.
 */
export function parseModuleString(module: string): ParsedPolicyModule | null {
  if (!module) {
    return null;
  }

  const match = OCI_REF_RE.exec(module);

  if (!match) {
    return null;
  }

  return {
    registry:   match[1] || '',
    repository: match[2],
    tag:        match[3],
  };
}

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
export function isGlobalPolicy(policyChart: PolicyChart, schemas: any): boolean {
  if (policyChart) {
    const resources: string[] | undefined = policyChart.annotations?.['kubewarden/resources']?.split(',');
    let targetsNonNamespaced: boolean = false;

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
