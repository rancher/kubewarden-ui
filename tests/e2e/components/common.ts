import semver from 'semver'
import yaml from 'js-yaml'
import { uniqBy } from 'lodash'
import { AppVersion } from '../pages/kubewarden.page'
import { RancherUI } from './rancher-ui'

/**
 * Common helper functions and constants
 */
export class Common {
  // Build kubewarden version map for upgrade test
  // { app: 'v1.22.0', controller: '5.0.0', crds: '1.14.0', defaults: '3.0.0' }
  static async fetchVersionMap(): Promise<AppVersion[]> {
    // Fetch and parse YAML index file
    const response = await fetch('https://charts.kubewarden.io/index.yaml')
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)

    const indexData = yaml.load(await response.text()) as { entries: Record<string, any[]> }
    const versionMap: Record<string, Partial<AppVersion>> = {}
    const chartNames = ['kubewarden-controller', 'kubewarden-crds', 'kubewarden-defaults']

    for (const chartName of chartNames) {
      const key = chartName.replace('kubewarden-', '') as keyof AppVersion

      for (const chart of indexData.entries[chartName]) {
        // Remove prerelease and unsupported versions
        if (semver.prerelease(chart.appVersion)) continue
        if (!RancherUI.isVersion(chart.annotations?.['catalog.cattle.io/rancher-version'] || '*')) continue

        // Process each relevant chart entry
        versionMap[chart.appVersion] ??= { app: chart.appVersion }
        if (semver.gt(chart.version, versionMap[chart.appVersion][key] ?? '0.0.0')) {
          versionMap[chart.appVersion][key] = chart.version
        }
      }
    }

    return uniqBy(
      Object.values(versionMap)
        // Filter out incomplete entries
        .filter((e): e is AppVersion => !!e.controller && !!e.crds && !!e.defaults)
        .sort((a, b) => semver.rcompare(a.app, b.app)),
      // Unique minor version (skip 1.32.0 if 1.32.1 is available)
      v => `${semver.major(v.app)}.${semver.minor(v.app)}`
    ).reverse()
  }
}
