import { ServiceMonitor, ServiceMonitorConfig } from '@kubewarden/types';

export type Labels = Record<string, string> | undefined;

/**
 * Checks if the provided labels object matches a Policy Server resource.
 *
 * It supports both:
 * - The legacy label: `app=kubewarden-policy-server-<policyServerName>`
 * - The new strict labels:
 *    - `app.kubernetes.io/instance`: `policy-server-<policyServerName>`
 *    - `app.kubernetes.io/component`: `policy-server`
 *    - `app.kubernetes.io/part-of`: `kubewarden`
 *    - `app.kubernetes.io/managed-by`: `kubewarden-controller`
 *
 * @param labels - The labels object to check.
 * @param policyServerName - The policy server name.
 * @returns True if the labels match.
 */
export function isPolicyServerResource(labels: Labels, policyServerName: string): boolean {
  if (!labels) {
    return false;
  }

  // Check the legacy label format.
  const legacyMatch = labels.app === `kubewarden-policy-server-${ policyServerName }`;

  // Check the new strict label format.
  const newMatch =
    labels['app.kubernetes.io/instance'] === `policy-server-${ policyServerName }` &&
    labels['app.kubernetes.io/component'] === 'policy-server' &&
    labels['app.kubernetes.io/part-of'] === 'kubewarden' &&
    labels['app.kubernetes.io/managed-by'] === 'kubewarden-controller';

  return legacyMatch || newMatch;
}

/**
 * Finds the first matching resource from an array based on Policy Server labels.
 *
 * @param resources - The list of resources to search.
 * @param policyServerName - The policy server name to match.
 * @param labelAccessor - Optional function to extract the labels from a resource.
 *                        Defaults to extracting `res.metadata?.labels`.
 * @returns The matching resource if found.
 */
export function findPolicyServerResource<T>(
  resources: T[],
  policyServerName: string,
  labelAccessor: (resource: T) => Record<string, string> | undefined = (res: any) => res.metadata?.labels // eslint-disable-line no-unused-vars
): T | undefined {
  return resources.find((resource: T) => {
    const labels = labelAccessor(resource);

    return isPolicyServerResource(labels, policyServerName);
  });
}

/**
 * Searches provided ServiceMonitors for a matching resource based on selector.matchLabels.
 * It checks for both the legacy and new strict Policy Server labels.
 *
 * @param config - Contains either a policy object or policy server object along with all fetched ServiceMonitors.
 * @returns The matching ServiceMonitor if found.
 */
export function findServiceMonitor(config: ServiceMonitorConfig): ServiceMonitor | undefined {
  const { policyObj, policyServerObj, allServiceMonitors } = config;

  if (allServiceMonitors && allServiceMonitors.length > 0) {
    const smName: string | undefined = policyObj ? policyObj.spec?.policyServer : policyServerObj?.id;

    if (!smName) {
      return undefined;
    }

    return allServiceMonitors.find((sm) => {
      const labels = sm?.spec?.selector?.matchLabels;

      return isPolicyServerResource(labels, smName);
    });
  }

  return undefined;
}
