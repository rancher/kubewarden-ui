import assert from 'node:assert'

export const conf = {
  // Install UI extension from: source (yarn dev), github (github tag), prime (official)
  ui_from: (process.env.ORIGIN || process.env.UI || undefined) as 'source'|'github'|'prime'|undefined,
  // Install Kubewarden from: github (community), gitlab (mr), prime (official)
  kw_from: (process.env.KW || 'appco') as 'github'|'gitlab'|'appco',
  // How to install Kubewarden: manual (from UI extension), fleet, upgrade (previous version)
  kw_mode: (process.env.MODE || 'manual') as 'manual'|'fleet'|'upgrade',

  // Extra config if ui_from=source
  source: {
    // VERSION=0.0.1 yarn build-pkg kubewarden
    kubewarden : 'http://127.0.0.1:4500/kubewarden-0.0.1/kubewarden-0.0.1.umd.min.js',
    // VERSION=0.0.1 yarn build-pkg vulnerability-scanner
    sbomscanner: 'http://127.0.0.1:4501/vulnerability-scanner-0.0.1/vulnerability-scanner-0.0.1.umd.min.js',
    // VERSION=0.0.1 yarn build-pkg runtime-enforcer
    runenforcer: 'http://127.0.0.1:4501/runtime-enforcer-0.0.1/runtime-enforcer-0.0.1.umd.min.js',
  },

  // Extra config
  kw: {
    repo: process.env.REPO,
    tag : process.env.TAG
  },

  // Credentials &  config
  appco: {
    user: process.env.APPCO_USERNAME,
    pass: process.env.APPCO_PASSWORD
  },
  github: {
    user: process.env.GITHUB_USERNAME,
    pass: process.env.GITHUB_PASSWORD
  },
  gitlab: undefined
}

// https://github.com/kubewarden/adm-controller-embargoed
if (conf.kw.repo?.includes('kubewarden/adm-controller-embargoed')) {
  conf.kw.repo = 'kubewarden/adm-controller-embargoed'
  conf.kw_from = 'github'
  conf.kw.tag = 'latest'
}

// Check values
if (conf.ui_from) assert(/^(source|github|prime)$/.test(conf.ui_from))
if (conf.kw_mode) assert(/^(manual|fleet|upgrade)$/.test(conf.kw_mode))
if (conf.kw_from) assert(/^(github|gitlab|appco)$/.test(conf.kw_from))

if (conf.kw_from !== 'github') {
  assert(conf.appco.user)
  assert(conf.appco.pass)
}
