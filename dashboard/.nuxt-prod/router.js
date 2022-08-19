import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _1eb45f86 = () => interopDefault(import('../node_modules/@rancher/shell/pages/about.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/about" */))
const _7cadf82e = () => interopDefault(import('../node_modules/@rancher/shell/pages/account/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/account/index" */))
const _fe1aa942 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/index" */))
const _62cf925a = () => interopDefault(import('../node_modules/@rancher/shell/pages/clusters/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/clusters/index" */))
const _19490f7e = () => interopDefault(import('../node_modules/@rancher/shell/pages/diagnostic.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/diagnostic" */))
const _683387de = () => interopDefault(import('../node_modules/@rancher/shell/pages/fail-whale.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/fail-whale" */))
const _181207f6 = () => interopDefault(import('../node_modules/@rancher/shell/pages/home.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/home" */))
const _79b0fdd9 = () => interopDefault(import('../node_modules/@rancher/shell/pages/plugins.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/plugins" */))
const _22249529 = () => interopDefault(import('../node_modules/@rancher/shell/pages/prefs.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/prefs" */))
const _4392d70b = () => interopDefault(import('../node_modules/@rancher/shell/pages/support/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/support/index" */))
const _0f2c0787 = () => interopDefault(import('../node_modules/@rancher/shell/pages/account/create-key.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/account/create-key" */))
const _c125bace = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/login.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/login" */))
const _c96f8dec = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/logout.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/logout" */))
const _62c7c3ad = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/setup.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/setup" */))
const _7b6f9c79 = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/verify.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/verify" */))
const _48f4e4b8 = () => interopDefault(import('../node_modules/@rancher/shell/pages/docs/toc.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/docs/toc" */))
const _aa1f84ca = () => interopDefault(import('../node_modules/@rancher/shell/pages/rio/mesh.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/rio/mesh" */))
const _7fb8ecc1 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/index" */))
const _5c455346 = () => interopDefault(import('../node_modules/@rancher/shell/pages/docs/_doc.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/docs/_doc" */))
const _ab1c41d4 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/index" */))
const _0bf3e6cc = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/index" */))
const _5dadc826 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/backup/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/backup/index" */))
const _53635b02 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/cis/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/cis/index" */))
const _07ce4ec1 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/ecm/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/ecm/index" */))
const _1bf72423 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/index" */))
const _594cf000 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/fleet/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/fleet/index" */))
const _812168be = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/index" */))
const _0017bf08 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/index" */))
const _313415db = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvesterManager/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvesterManager/index" */))
const _3df8c362 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/istio/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/istio/index" */))
const _7cb3a96d = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/index" */))
const _eee069de = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/logging/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/logging/index" */))
const _3967b9e3 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/longhorn/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/longhorn/index" */))
const _1ec8f442 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/index" */))
const _3fb28fec = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/mcapps/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/mcapps/index" */))
const _5693faac = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/index" */))
const _056f07d3 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/neuvector/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/neuvector/index" */))
const _58fc09f2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/index" */))
const _5d8c4f04 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/index" */))
const _17dea93b = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/config/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/config/index" */))
const _972f3f0c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/index" */))
const _769ab672 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/ConfigBadge.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/ConfigBadge" */))
const _17248d26 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/EventsTable.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/EventsTable" */))
const _a1194ba6 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/explorer-utils.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/explorer-utils" */))
const _01a36e2f = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/index" */))
const _132545c1 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/fleet/GitRepoGraphConfig.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/fleet/GitRepoGraphConfig" */))
const _12845ef0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/constraints/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/constraints/index" */))
const _2842e689 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/airgapupgrade/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/airgapupgrade/index" */))
const _2bff6270 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/support/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/support/index" */))
const _b06c8a12 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/index" */))
const _756d6408 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/index" */))
const _0d881da8 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/index" */))
const _1f6bb237 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/index" */))
const _4d3f2bcc = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/index" */))
const _7933833c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/banners.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/banners" */))
const _56928988 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/brand" */))
const _125b59a5 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/performance.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/performance" */))
const _2822cfe0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/chart.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/chart" */))
const _cb4dfe66 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/install.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/install" */))
const _b7b441dc = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/group.principal/assign-edit.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/group.principal/assign-edit" */))
const _7bd77636 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/pipelines.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/pipelines" */))
const _0b94bc42 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/create" */))
const _14824132 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/create" */))
const _fb4acf1c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/create" */))
const _090c4b00 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/pages/_page" */))
const _33ebbe63 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/config/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/config/_id" */))
const _6c17a184 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/pages/_page" */))
const _108aff93 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/_page" */))
const _64eac138 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/_id" */))
const _43e523a0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/pages/_page" */))
const _24340b06 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/mcapps/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/mcapps/pages/_page" */))
const _2d22d4aa = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index" */))
const _b4049d98 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/_id" */))
const _17e81934 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/create" */))
const _7eed8330 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/serial.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/serial" */))
const _2e95b8c2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/vnc.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/vnc" */))
const _4a8032c7 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver" */))
const _44814a80 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/_id" */))
const _6abae21c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/_namespace/_id" */))
const _0c320630 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/navlinks/_group" */))
const _054b3358 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/index" */))
const _39a4c244 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/members/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/members/index" */))
const _911ea934 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/namespaces" */))
const _722fb060 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/projectsnamespaces.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/projectsnamespaces" */))
const _1fec9fb2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/index" */))
const _055ba14c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/create" */))
const _a5ba32cc = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_id" */))
const _91b4c852 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_namespace/_id" */))
const _3e6c3a4b = () => interopDefault(import('../node_modules/@rancher/shell/pages/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/about",
    component: _1eb45f86,
    name: "about"
  }, {
    path: "/account",
    component: _7cadf82e,
    name: "account"
  }, {
    path: "/c",
    component: _fe1aa942,
    name: "c"
  }, {
    path: "/clusters",
    component: _62cf925a,
    name: "clusters"
  }, {
    path: "/diagnostic",
    component: _19490f7e,
    name: "diagnostic"
  }, {
    path: "/fail-whale",
    component: _683387de,
    name: "fail-whale"
  }, {
    path: "/home",
    component: _181207f6,
    name: "home"
  }, {
    path: "/plugins",
    component: _79b0fdd9,
    name: "plugins"
  }, {
    path: "/prefs",
    component: _22249529,
    name: "prefs"
  }, {
    path: "/support",
    component: _4392d70b,
    name: "support"
  }, {
    path: "/account/create-key",
    component: _0f2c0787,
    name: "account-create-key"
  }, {
    path: "/auth/login",
    component: _c125bace,
    name: "auth-login"
  }, {
    path: "/auth/logout",
    component: _c96f8dec,
    name: "auth-logout"
  }, {
    path: "/auth/setup",
    component: _62c7c3ad,
    name: "auth-setup"
  }, {
    path: "/auth/verify",
    component: _7b6f9c79,
    name: "auth-verify"
  }, {
    path: "/docs/toc",
    component: _48f4e4b8,
    name: "docs-toc"
  }, {
    path: "/rio/mesh",
    component: _aa1f84ca,
    name: "rio-mesh"
  }, {
    path: "/c/:cluster",
    component: _7fb8ecc1,
    name: "c-cluster"
  }, {
    path: "/docs/:doc?",
    component: _5c455346,
    name: "docs-doc"
  }, {
    path: "/c/:cluster/apps",
    component: _ab1c41d4,
    name: "c-cluster-apps"
  }, {
    path: "/c/:cluster/auth",
    component: _0bf3e6cc,
    name: "c-cluster-auth"
  }, {
    path: "/c/:cluster/backup",
    component: _5dadc826,
    name: "c-cluster-backup"
  }, {
    path: "/c/:cluster/cis",
    component: _53635b02,
    name: "c-cluster-cis"
  }, {
    path: "/c/:cluster/ecm",
    component: _07ce4ec1,
    name: "c-cluster-ecm"
  }, {
    path: "/c/:cluster/explorer",
    component: _1bf72423,
    name: "c-cluster-explorer"
  }, {
    path: "/c/:cluster/fleet",
    component: _594cf000,
    name: "c-cluster-fleet"
  }, {
    path: "/c/:cluster/gatekeeper",
    component: _812168be,
    name: "c-cluster-gatekeeper"
  }, {
    path: "/c/:cluster/harvester",
    component: _0017bf08,
    name: "c-cluster-harvester"
  }, {
    path: "/c/:cluster/harvesterManager",
    component: _313415db,
    name: "c-cluster-harvesterManager"
  }, {
    path: "/c/:cluster/istio",
    component: _3df8c362,
    name: "c-cluster-istio"
  }, {
    path: "/c/:cluster/legacy",
    component: _7cb3a96d,
    name: "c-cluster-legacy"
  }, {
    path: "/c/:cluster/logging",
    component: _eee069de,
    name: "c-cluster-logging"
  }, {
    path: "/c/:cluster/longhorn",
    component: _3967b9e3,
    name: "c-cluster-longhorn"
  }, {
    path: "/c/:cluster/manager",
    component: _1ec8f442,
    name: "c-cluster-manager"
  }, {
    path: "/c/:cluster/mcapps",
    component: _3fb28fec,
    name: "c-cluster-mcapps"
  }, {
    path: "/c/:cluster/monitoring",
    component: _5693faac,
    name: "c-cluster-monitoring"
  }, {
    path: "/c/:cluster/neuvector",
    component: _056f07d3,
    name: "c-cluster-neuvector"
  }, {
    path: "/c/:cluster/settings",
    component: _58fc09f2,
    name: "c-cluster-settings"
  }, {
    path: "/c/:cluster/apps/charts",
    component: _5d8c4f04,
    name: "c-cluster-apps-charts"
  }, {
    path: "/c/:cluster/auth/config",
    component: _17dea93b,
    name: "c-cluster-auth-config"
  }, {
    path: "/c/:cluster/auth/roles",
    component: _972f3f0c,
    name: "c-cluster-auth-roles"
  }, {
    path: "/c/:cluster/explorer/ConfigBadge",
    component: _769ab672,
    name: "c-cluster-explorer-ConfigBadge"
  }, {
    path: "/c/:cluster/explorer/EventsTable",
    component: _17248d26,
    name: "c-cluster-explorer-EventsTable"
  }, {
    path: "/c/:cluster/explorer/explorer-utils",
    component: _a1194ba6,
    name: "c-cluster-explorer-explorer-utils"
  }, {
    path: "/c/:cluster/explorer/tools",
    component: _01a36e2f,
    name: "c-cluster-explorer-tools"
  }, {
    path: "/c/:cluster/fleet/GitRepoGraphConfig",
    component: _132545c1,
    name: "c-cluster-fleet-GitRepoGraphConfig"
  }, {
    path: "/c/:cluster/gatekeeper/constraints",
    component: _12845ef0,
    name: "c-cluster-gatekeeper-constraints"
  }, {
    path: "/c/:cluster/harvester/airgapupgrade",
    component: _2842e689,
    name: "c-cluster-harvester-airgapupgrade"
  }, {
    path: "/c/:cluster/harvester/support",
    component: _2bff6270,
    name: "c-cluster-harvester-support"
  }, {
    path: "/c/:cluster/legacy/project",
    component: _b06c8a12,
    name: "c-cluster-legacy-project"
  }, {
    path: "/c/:cluster/manager/cloudCredential",
    component: _756d6408,
    name: "c-cluster-manager-cloudCredential"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig",
    component: _0d881da8,
    name: "c-cluster-monitoring-alertmanagerconfig"
  }, {
    path: "/c/:cluster/monitoring/monitor",
    component: _1f6bb237,
    name: "c-cluster-monitoring-monitor"
  }, {
    path: "/c/:cluster/monitoring/route-receiver",
    component: _4d3f2bcc,
    name: "c-cluster-monitoring-route-receiver"
  }, {
    path: "/c/:cluster/settings/banners",
    component: _7933833c,
    name: "c-cluster-settings-banners"
  }, {
    path: "/c/:cluster/settings/brand",
    component: _56928988,
    name: "c-cluster-settings-brand"
  }, {
    path: "/c/:cluster/settings/performance",
    component: _125b59a5,
    name: "c-cluster-settings-performance"
  }, {
    path: "/c/:cluster/apps/charts/chart",
    component: _2822cfe0,
    name: "c-cluster-apps-charts-chart"
  }, {
    path: "/c/:cluster/apps/charts/install",
    component: _cb4dfe66,
    name: "c-cluster-apps-charts-install"
  }, {
    path: "/c/:cluster/auth/group.principal/assign-edit",
    component: _b7b441dc,
    name: "c-cluster-auth-group.principal-assign-edit"
  }, {
    path: "/c/:cluster/legacy/project/pipelines",
    component: _7bd77636,
    name: "c-cluster-legacy-project-pipelines"
  }, {
    path: "/c/:cluster/manager/cloudCredential/create",
    component: _0b94bc42,
    name: "c-cluster-manager-cloudCredential-create"
  }, {
    path: "/c/:cluster/monitoring/monitor/create",
    component: _14824132,
    name: "c-cluster-monitoring-monitor-create"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/create",
    component: _fb4acf1c,
    name: "c-cluster-monitoring-route-receiver-create"
  }, {
    path: "/c/:cluster/explorer/tools/pages/:page?",
    component: _090c4b00,
    name: "c-cluster-explorer-tools-pages-page"
  }, {
    path: "/c/:cluster/auth/config/:id",
    component: _33ebbe63,
    name: "c-cluster-auth-config-id"
  }, {
    path: "/c/:cluster/legacy/pages/:page?",
    component: _6c17a184,
    name: "c-cluster-legacy-pages-page"
  }, {
    path: "/c/:cluster/legacy/project/:page",
    component: _108aff93,
    name: "c-cluster-legacy-project-page"
  }, {
    path: "/c/:cluster/manager/cloudCredential/:id",
    component: _64eac138,
    name: "c-cluster-manager-cloudCredential-id"
  }, {
    path: "/c/:cluster/manager/pages/:page?",
    component: _43e523a0,
    name: "c-cluster-manager-pages-page"
  }, {
    path: "/c/:cluster/mcapps/pages/:page?",
    component: _24340b06,
    name: "c-cluster-mcapps-pages-page"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid",
    component: _2d22d4aa,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/:id?",
    component: _b4049d98,
    name: "c-cluster-monitoring-route-receiver-id"
  }, {
    path: "/c/:cluster/auth/roles/:resource/create",
    component: _17e81934,
    name: "c-cluster-auth-roles-resource-create"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/serial",
    component: _7eed8330,
    name: "c-cluster-harvester-console-uid-serial"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/vnc",
    component: _2e95b8c2,
    name: "c-cluster-harvester-console-uid-vnc"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver",
    component: _4a8032c7,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver"
  }, {
    path: "/c/:cluster/auth/roles/:resource/:id?",
    component: _44814a80,
    name: "c-cluster-auth-roles-resource-id"
  }, {
    path: "/c/:cluster/monitoring/monitor/:namespace/:id?",
    component: _6abae21c,
    name: "c-cluster-monitoring-monitor-namespace-id"
  }, {
    path: "/c/:cluster/navlinks/:group?",
    component: _0c320630,
    name: "c-cluster-navlinks-group"
  }, {
    path: "/c/:cluster/:product",
    component: _054b3358,
    name: "c-cluster-product"
  }, {
    path: "/c/:cluster/:product/members",
    component: _39a4c244,
    name: "c-cluster-product-members"
  }, {
    path: "/c/:cluster/:product/namespaces",
    component: _911ea934,
    name: "c-cluster-product-namespaces"
  }, {
    path: "/c/:cluster/:product/projectsnamespaces",
    component: _722fb060,
    name: "c-cluster-product-projectsnamespaces"
  }, {
    path: "/c/:cluster/:product/:resource",
    component: _1fec9fb2,
    name: "c-cluster-product-resource"
  }, {
    path: "/c/:cluster/:product/:resource/create",
    component: _055ba14c,
    name: "c-cluster-product-resource-create"
  }, {
    path: "/c/:cluster/:product/:resource/:id",
    component: _a5ba32cc,
    name: "c-cluster-product-resource-id"
  }, {
    path: "/c/:cluster/:product/:resource/:namespace/:id?",
    component: _91b4c852,
    name: "c-cluster-product-resource-namespace-id"
  }, {
    path: "/",
    component: _3e6c3a4b,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
