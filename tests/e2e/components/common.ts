import semver from 'semver'
import yaml from 'js-yaml'
import { uniqBy } from 'lodash'
import { AppVersion } from '../pages/kubewarden.page'
import { RancherUI } from './rancher-ui'
import { execFileSync } from 'child_process'

interface GitLabRefs {
  chart: string
  reg  : string
  tag  : string
}

type Product = 'Admission Controller' | 'Vulnerability Scanner' | 'Runtime Enforcer' | 'Network Enforcer'

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

  // KW = github / gitlab / prime / mr56:21
  static findGitLabRefs(product: Product, options?: { mrc?: string, mri?: string }): GitLabRefs {
    const slugName = `suse-security-${product.replace(' ', '-').toLowerCase()}`
    // const shortName = product.split(' ').map(w => w[0]).join('')

    // Search only once
    // if (product == 'Admission Controller' && process.env.GL_CHART && process.env.GL_REG && process.env.GL_TAG) {
    //   return { chart: process.env.GL_CHART, reg: process.env.GL_REG, tag: process.env.GL_TAG }
    // }

    // Without MR
    const def = {
      chart: `oci://registry.suse.de/devel/jasmine/charts/charts/${slugName}`,
      reg  : 'registry.suse.de/devel/jasmine/containers',
      tag  : '1' // undefined
    }
    // GH runners without glab for now
    if (process.env.CI && !options?.mrc && !options?.mri) return def

    const title = `SUSE Security ${product}`
    const findMr = (repo: string) => JSON.parse(
      execFileSync('glab', ['mr', 'list', '-R', repo, '--search', title, '-F', 'json'], { encoding: 'utf-8' })
    )[0]

    // Chart
    // const chartMr = firstMr('https://gitlab.suse.de/orchid/suse-products-recipes/suse-security/charts')
    const mrc = options?.mrc || findMr('https://gitlab.suse.de/orchid/suse-products-recipes/suse-security/charts')?.iid
    const chart = mrc ? `oci://registry.suse.de/devel/jasmine/charts/suse-security/mr-${mrc}/charts/${slugName}` : def.chart

    // Image Registry
    const mri = options?.mri || findMr('https://gitlab.suse.de/orchid/suse-products-recipes/suse-security/rpms-containers')?.iid
    const reg = mri ? `registry.suse.de/devel/jasmine/containers/suse-security/mr-${mri}` : def.reg
    // Tag might not exist without MR (1 = 1.37.2 = 1.37.2-12.6)
    // const tag = chartMr?.title.match(/\d+\.\d+\.\d+/)[0] || defTag
    // TODO: Check '1' exists on MR
    const tag = def.tag

    console.log('GitLab Refs', { chart, reg, tag })
    return { chart, reg, tag }
  }
}
