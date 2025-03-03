import semver from 'semver';

/**
 * Determines if the Kubewarden Extension is compatible with kubewarden-defaults version for displaying settings edit
 * for Kubewarden Extension `>= 1.4.2` it requires kubewarden-defaults version of `>= 2.0.0`
 * @param string
 * @param string
 * @returns Object
 */
export function kwDefaultsHelmChartSettings(kwDefaultsVersion: string, uiPluginVersion: string): boolean | void {
  if (semver.gt(uiPluginVersion, '1.4.1')) {
    return semver.gt(kwDefaultsVersion, '1.9.9');
  }

  return true;
}
