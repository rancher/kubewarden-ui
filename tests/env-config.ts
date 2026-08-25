import assert from 'node:assert'

export const conf = {
  // Install UI extension from: source (yarn dev), github (github tag), prime (official)
  ui_from: (process.env.ORIGIN || process.env.UI || undefined) as 'source'|'github'|'prime'|undefined,
  // Install Kubewarden from: github (community), gitlab (mr), prime (official)
  kw_from: (process.env.KW || 'prime') as 'github'|'gitlab'|'prime',
  // How to install Kubewarden: manual (from UI extension), fleet, upgrade (previous version)
  kw_mode: (process.env.MODE || 'manual') as 'manual'|'fleet'|'upgrade',

  // Extra config if kw_from=gitlab
  gitlab: {
    chart: process.env.GL_CHART,
    reg  : process.env.GL_REG,
    tag  : process.env.GL_TAG,
  },
  // Extra config if ui_from=source
  source: {
    // VERSION=0.0.1 yarn build-pkg kubewarden
    kubewarden : 'http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js',
    // VERSION=0.0.1 yarn build-pkg vulnerability-scanner
    sbomscanner: 'http://127.0.0.1:4501/vulnerability-scanner-0.0.1/vulnerability-scanner-0.0.1.umd.min.js',
    // VERSION=0.0.1 yarn build-pkg runtime-enforcer
    runenforcer: 'http://127.0.0.1:4501/runtime-enforcer-0.0.1/runtime-enforcer-0.0.1.umd.min.js',
  },

  // Credentials
  auth: {
    appco_user: process.env.APPCO_USERNAME,
    appco_pass: process.env.APPCO_PASSWORD
  }
}

// Check values
if (conf.ui_from) assert(/^(source|github|prime)$/.test(conf.ui_from))
if (conf.kw_mode) assert(/^(manual|fleet|upgrade)$/.test(conf.kw_mode))
if (conf.kw_from) assert(/^(github|gitlab|prime)$/.test(conf.kw_from))

if (conf.kw_from !== 'github') {
  assert(conf.auth.appco_user)
  assert(conf.auth.appco_pass)
}
