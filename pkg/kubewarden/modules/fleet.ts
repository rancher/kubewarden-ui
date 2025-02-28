import isEmpty from 'lodash/isEmpty';
import jsyaml from 'js-yaml';

import { FLEET } from '@shell/config/labels-annotations';
import { CatalogApp, FleetBundle } from '../types';

/**
 * Determines if an App contains the annotation for a Fleet Bundle: 'fleet.cattle.io/bundle-id'
 *
 * @param app `CatalogApp`
 * @returns boolean
 */
export function isFleetDeployment(app: CatalogApp): boolean {
  if (app) {
    return !!app.spec?.chart?.metadata?.annotations?.[FLEET.BUNDLE_ID];
  }

  return false;
}

/**
 * Finds and returns the first `FleetBundle` from an array of `FleetBundle`s that meets a specific condition.
 * This function skips any `FleetBundle` that contains a chart that matches a specified unwanted chart name.
 * It then searches for a resource within each `FleetBundle` that has content including a specified `kind`.
 *
 * @param context - The string value to be matched within the `kind` property of a resource's content in each `FleetBundle`.
 * @param fleetBundles - An array of `FleetBundle` objects to be searched.
 * @param skipChart? - The chart name string value to be skipped. If a `FleetBundle` contains a chart matching this value, the bundle is skipped.
 * @returns The first matching `FleetBundle` if found, or `null` if no match is found.
 */
export function findFleetContent(context: string, fleetBundles: FleetBundle[], skipChart?: string): FleetBundle | null {
  if (!isEmpty(fleetBundles)) {
    for (const bundle of fleetBundles) {
      if (skipChart && bundle?.spec?.helm?.chart === skipChart) {
        continue; // Skip this bundle
      }

      // Process the bundle for the context
      const matchingResource = bundle?.spec?.resources?.find((resource) => resource.content.includes(`kind: ${ context }`));

      if (matchingResource) {
        return bundle;
      }
    }
  }

  return null;
}

/**
 * Retrieves a module string in the format `${global.cattle.systemDefaultRegistry}/${policyServer.image.repository}:${policyServer.image.tag}`
 * from a `FleetBundle` that matches a given context. The function uses `findFleetContent` to find the appropriate `FleetBundle`
 * and then extracts the necessary properties from the 'values.yaml' file within that bundle.
 *
 * @param context - The context string used to find the matching `FleetBundle` via `findFleetContent`.
 * @param fleetBundles - An array of `FleetBundle` objects to search through.
 * @returns A module string in the specified format if all properties are found, or `null` if the `FleetBundle` does not exist or the properties are not found.
 */
export function getPolicyServerModule(fleetBundles: FleetBundle[]): string | null {
  const fleetBundle = findFleetContent('PolicyServer', fleetBundles, 'kubewarden-crds');

  if (fleetBundle) {
    const valuesYamlResource = fleetBundle.spec.resources.find((resource) => resource.name.includes('values.yaml'));

    if (valuesYamlResource) {
      try {
        const valuesYaml = jsyaml.load(valuesYamlResource.content) as any;

        const systemDefaultRegistry = valuesYaml?.global?.cattle?.systemDefaultRegistry;
        const repository = valuesYaml?.policyServer?.image?.repository;
        const tag = valuesYaml?.policyServer?.image?.tag;

        if (systemDefaultRegistry && repository && tag) {
          return `${ systemDefaultRegistry }/${ repository }:${ tag }`;
        }
      } catch (e) {
        console.warn('Error parsing YAML:', e);
      }
    }
  }

  return null;
}
