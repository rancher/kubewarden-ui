import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _7ef31aa1 = () => interopDefault(import('../node_modules/@rancher/shell/pages/about.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/about" */))
const _b79717f8 = () => interopDefault(import('../node_modules/@rancher/shell/pages/account/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/account/index" */))
const _6721e88c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/index" */))
const _3d7aca18 = () => interopDefault(import('../node_modules/@rancher/shell/pages/clusters/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/clusters/index" */))
const _781a0d43 = () => interopDefault(import('../node_modules/@rancher/shell/pages/diagnostic.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/diagnostic" */))
const _2ab739d6 = () => interopDefault(import('../node_modules/@rancher/shell/pages/fail-whale.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/fail-whale" */))
const _a05c050a = () => interopDefault(import('../node_modules/@rancher/shell/pages/home.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/home" */))
const _75a54398 = () => interopDefault(import('../node_modules/@rancher/shell/pages/plugins.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/plugins" */))
const _fb395f78 = () => interopDefault(import('../node_modules/@rancher/shell/pages/prefs.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/prefs" */))
const _261e4726 = () => interopDefault(import('../node_modules/@rancher/shell/pages/support/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/support/index" */))
const _5859704c = () => interopDefault(import('../node_modules/@rancher/shell/pages/account/create-key.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/account/create-key" */))
const _0383bf44 = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/login.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/login" */))
const _1696f3e5 = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/logout.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/logout" */))
const _7cce7d1c = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/setup.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/setup" */))
const _12835158 = () => interopDefault(import('../node_modules/@rancher/shell/pages/auth/verify.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/auth/verify" */))
const _2701edff = () => interopDefault(import('../node_modules/@rancher/shell/pages/docs/toc.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/docs/toc" */))
const _62002ec0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/rio/mesh.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/rio/mesh" */))
const _7f787a74 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/index" */))
const _8ba9ee3e = () => interopDefault(import('../node_modules/@rancher/shell/pages/docs/_doc.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/docs/_doc" */))
const _65c50431 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/index" */))
const _7171e832 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/index" */))
const _de67dafe = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/backup/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/backup/index" */))
const _ec76c3f8 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/cis/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/cis/index" */))
const _8976cb74 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/ecm/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/ecm/index" */))
const _00ac43be = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/index" */))
const _fb29f376 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/fleet/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/fleet/index" */))
const _4b5af07c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/index" */))
const _9bf2da66 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/index" */))
const _c06d2b14 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvesterManager/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvesterManager/index" */))
const _25eb7cb2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/istio/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/istio/index" */))
const _a05c1870 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/index" */))
const _8d8a67d4 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/logging/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/logging/index" */))
const _1e1cd97e = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/longhorn/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/longhorn/index" */))
const _214686e4 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/index" */))
const _72d0da47 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/mcapps/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/mcapps/index" */))
const _3b00c0f2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/index" */))
const _914448d0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/neuvector/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/neuvector/index" */))
const _8f91cabc = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/index" */))
const _4f154589 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/index" */))
const _09679fc0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/config/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/config/index" */))
const _40540555 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/index" */))
const _282275cd = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/ConfigBadge.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/ConfigBadge" */))
const _6ea766fe = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/EventsTable.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/EventsTable" */))
const _1e08aec8 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/explorer-utils.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/explorer-utils" */))
const _99a9a4ec = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/index" */))
const _773a8486 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/fleet/GitRepoGraphConfig.js' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/fleet/GitRepoGraphConfig" */))
const _172bf63a = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/constraints/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/gatekeeper/constraints/index" */))
const _3fc584e4 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/airgapupgrade/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/airgapupgrade/index" */))
const _4e158d8d = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/support/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/support/index" */))
const _59517a52 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/index" */))
const _7d23a501 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/index" */))
const _2c383071 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/index" */))
const _3dfe4c12 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/index" */))
const _77dfd591 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/index" */))
const _051f2817 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/banners.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/banners" */))
const _8d284a52 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/brand.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/brand" */))
const _7839ce00 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/settings/performance.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/settings/performance" */))
const _4510e2d6 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/chart.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/chart" */))
const _4d7e6a12 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/apps/charts/install.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/apps/charts/install" */))
const _64cb2426 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/group.principal/assign-edit.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/group.principal/assign-edit" */))
const _cb2bdfde = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/pipelines.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/pipelines" */))
const _4f0545dd = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/create" */))
const _ad00fe28 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/create" */))
const _a861b166 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/create" */))
const _80652cca = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/explorer/tools/pages/_page" */))
const _344adbb0 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/config/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/config/_id" */))
const _098a0959 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/pages/_page" */))
const _7bda8224 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/legacy/project/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/legacy/project/_page" */))
const _d8ae18ae = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/cloudCredential/_id" */))
const _dd9a5116 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/manager/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/manager/pages/_page" */))
const _2d7bd498 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/mcapps/pages/_page.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/mcapps/pages/_page" */))
const _2197bba2 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/index" */))
const _5dd80839 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/route-receiver/_id" */))
const _8bab70aa = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/create" */))
const _36c7da35 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/serial.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/serial" */))
const _a5ee9a8c = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/vnc.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/harvester/console/_uid/vnc" */))
const _260c3b22 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/alertmanagerconfig/_alertmanagerconfigid/receiver" */))
const _075c16ca = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/auth/roles/_resource/_id" */))
const _60804912 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/_namespace/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/monitoring/monitor/_namespace/_id" */))
const _a8545ea6 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/navlinks/_group.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/navlinks/_group" */))
const _3be0f422 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/index" */))
const _51c2f379 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/members/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/members/index" */))
const _6a9614ab = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/namespaces.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/namespaces" */))
const _384e04a5 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/projectsnamespaces.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/projectsnamespaces" */))
const _3e7f398d = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/index" */))
const _8dc77a5e = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/create.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/create" */))
const _1bb83b35 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_id" */))
const _877a2f48 = () => interopDefault(import('../node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_namespace/_id.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/c/_cluster/_product/_resource/_namespace/_id" */))
const _c2aa1534 = () => interopDefault(import('../node_modules/@rancher/shell/pages/index.vue' /* webpackChunkName: "node_modules/@rancher/shell/pages/index" */))

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
    component: _7ef31aa1,
    name: "about"
  }, {
    path: "/account",
    component: _b79717f8,
    name: "account"
  }, {
    path: "/c",
    component: _6721e88c,
    name: "c"
  }, {
    path: "/clusters",
    component: _3d7aca18,
    name: "clusters"
  }, {
    path: "/diagnostic",
    component: _781a0d43,
    name: "diagnostic"
  }, {
    path: "/fail-whale",
    component: _2ab739d6,
    name: "fail-whale"
  }, {
    path: "/home",
    component: _a05c050a,
    name: "home"
  }, {
    path: "/plugins",
    component: _75a54398,
    name: "plugins"
  }, {
    path: "/prefs",
    component: _fb395f78,
    name: "prefs"
  }, {
    path: "/support",
    component: _261e4726,
    name: "support"
  }, {
    path: "/account/create-key",
    component: _5859704c,
    name: "account-create-key"
  }, {
    path: "/auth/login",
    component: _0383bf44,
    name: "auth-login"
  }, {
    path: "/auth/logout",
    component: _1696f3e5,
    name: "auth-logout"
  }, {
    path: "/auth/setup",
    component: _7cce7d1c,
    name: "auth-setup"
  }, {
    path: "/auth/verify",
    component: _12835158,
    name: "auth-verify"
  }, {
    path: "/docs/toc",
    component: _2701edff,
    name: "docs-toc"
  }, {
    path: "/rio/mesh",
    component: _62002ec0,
    name: "rio-mesh"
  }, {
    path: "/c/:cluster",
    component: _7f787a74,
    name: "c-cluster"
  }, {
    path: "/docs/:doc?",
    component: _8ba9ee3e,
    name: "docs-doc"
  }, {
    path: "/c/:cluster/apps",
    component: _65c50431,
    name: "c-cluster-apps"
  }, {
    path: "/c/:cluster/auth",
    component: _7171e832,
    name: "c-cluster-auth"
  }, {
    path: "/c/:cluster/backup",
    component: _de67dafe,
    name: "c-cluster-backup"
  }, {
    path: "/c/:cluster/cis",
    component: _ec76c3f8,
    name: "c-cluster-cis"
  }, {
    path: "/c/:cluster/ecm",
    component: _8976cb74,
    name: "c-cluster-ecm"
  }, {
    path: "/c/:cluster/explorer",
    component: _00ac43be,
    name: "c-cluster-explorer"
  }, {
    path: "/c/:cluster/fleet",
    component: _fb29f376,
    name: "c-cluster-fleet"
  }, {
    path: "/c/:cluster/gatekeeper",
    component: _4b5af07c,
    name: "c-cluster-gatekeeper"
  }, {
    path: "/c/:cluster/harvester",
    component: _9bf2da66,
    name: "c-cluster-harvester"
  }, {
    path: "/c/:cluster/harvesterManager",
    component: _c06d2b14,
    name: "c-cluster-harvesterManager"
  }, {
    path: "/c/:cluster/istio",
    component: _25eb7cb2,
    name: "c-cluster-istio"
  }, {
    path: "/c/:cluster/legacy",
    component: _a05c1870,
    name: "c-cluster-legacy"
  }, {
    path: "/c/:cluster/logging",
    component: _8d8a67d4,
    name: "c-cluster-logging"
  }, {
    path: "/c/:cluster/longhorn",
    component: _1e1cd97e,
    name: "c-cluster-longhorn"
  }, {
    path: "/c/:cluster/manager",
    component: _214686e4,
    name: "c-cluster-manager"
  }, {
    path: "/c/:cluster/mcapps",
    component: _72d0da47,
    name: "c-cluster-mcapps"
  }, {
    path: "/c/:cluster/monitoring",
    component: _3b00c0f2,
    name: "c-cluster-monitoring"
  }, {
    path: "/c/:cluster/neuvector",
    component: _914448d0,
    name: "c-cluster-neuvector"
  }, {
    path: "/c/:cluster/settings",
    component: _8f91cabc,
    name: "c-cluster-settings"
  }, {
    path: "/c/:cluster/apps/charts",
    component: _4f154589,
    name: "c-cluster-apps-charts"
  }, {
    path: "/c/:cluster/auth/config",
    component: _09679fc0,
    name: "c-cluster-auth-config"
  }, {
    path: "/c/:cluster/auth/roles",
    component: _40540555,
    name: "c-cluster-auth-roles"
  }, {
    path: "/c/:cluster/explorer/ConfigBadge",
    component: _282275cd,
    name: "c-cluster-explorer-ConfigBadge"
  }, {
    path: "/c/:cluster/explorer/EventsTable",
    component: _6ea766fe,
    name: "c-cluster-explorer-EventsTable"
  }, {
    path: "/c/:cluster/explorer/explorer-utils",
    component: _1e08aec8,
    name: "c-cluster-explorer-explorer-utils"
  }, {
    path: "/c/:cluster/explorer/tools",
    component: _99a9a4ec,
    name: "c-cluster-explorer-tools"
  }, {
    path: "/c/:cluster/fleet/GitRepoGraphConfig",
    component: _773a8486,
    name: "c-cluster-fleet-GitRepoGraphConfig"
  }, {
    path: "/c/:cluster/gatekeeper/constraints",
    component: _172bf63a,
    name: "c-cluster-gatekeeper-constraints"
  }, {
    path: "/c/:cluster/harvester/airgapupgrade",
    component: _3fc584e4,
    name: "c-cluster-harvester-airgapupgrade"
  }, {
    path: "/c/:cluster/harvester/support",
    component: _4e158d8d,
    name: "c-cluster-harvester-support"
  }, {
    path: "/c/:cluster/legacy/project",
    component: _59517a52,
    name: "c-cluster-legacy-project"
  }, {
    path: "/c/:cluster/manager/cloudCredential",
    component: _7d23a501,
    name: "c-cluster-manager-cloudCredential"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig",
    component: _2c383071,
    name: "c-cluster-monitoring-alertmanagerconfig"
  }, {
    path: "/c/:cluster/monitoring/monitor",
    component: _3dfe4c12,
    name: "c-cluster-monitoring-monitor"
  }, {
    path: "/c/:cluster/monitoring/route-receiver",
    component: _77dfd591,
    name: "c-cluster-monitoring-route-receiver"
  }, {
    path: "/c/:cluster/settings/banners",
    component: _051f2817,
    name: "c-cluster-settings-banners"
  }, {
    path: "/c/:cluster/settings/brand",
    component: _8d284a52,
    name: "c-cluster-settings-brand"
  }, {
    path: "/c/:cluster/settings/performance",
    component: _7839ce00,
    name: "c-cluster-settings-performance"
  }, {
    path: "/c/:cluster/apps/charts/chart",
    component: _4510e2d6,
    name: "c-cluster-apps-charts-chart"
  }, {
    path: "/c/:cluster/apps/charts/install",
    component: _4d7e6a12,
    name: "c-cluster-apps-charts-install"
  }, {
    path: "/c/:cluster/auth/group.principal/assign-edit",
    component: _64cb2426,
    name: "c-cluster-auth-group.principal-assign-edit"
  }, {
    path: "/c/:cluster/legacy/project/pipelines",
    component: _cb2bdfde,
    name: "c-cluster-legacy-project-pipelines"
  }, {
    path: "/c/:cluster/manager/cloudCredential/create",
    component: _4f0545dd,
    name: "c-cluster-manager-cloudCredential-create"
  }, {
    path: "/c/:cluster/monitoring/monitor/create",
    component: _ad00fe28,
    name: "c-cluster-monitoring-monitor-create"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/create",
    component: _a861b166,
    name: "c-cluster-monitoring-route-receiver-create"
  }, {
    path: "/c/:cluster/explorer/tools/pages/:page?",
    component: _80652cca,
    name: "c-cluster-explorer-tools-pages-page"
  }, {
    path: "/c/:cluster/auth/config/:id",
    component: _344adbb0,
    name: "c-cluster-auth-config-id"
  }, {
    path: "/c/:cluster/legacy/pages/:page?",
    component: _098a0959,
    name: "c-cluster-legacy-pages-page"
  }, {
    path: "/c/:cluster/legacy/project/:page",
    component: _7bda8224,
    name: "c-cluster-legacy-project-page"
  }, {
    path: "/c/:cluster/manager/cloudCredential/:id",
    component: _d8ae18ae,
    name: "c-cluster-manager-cloudCredential-id"
  }, {
    path: "/c/:cluster/manager/pages/:page?",
    component: _dd9a5116,
    name: "c-cluster-manager-pages-page"
  }, {
    path: "/c/:cluster/mcapps/pages/:page?",
    component: _2d7bd498,
    name: "c-cluster-mcapps-pages-page"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid",
    component: _2197bba2,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid"
  }, {
    path: "/c/:cluster/monitoring/route-receiver/:id?",
    component: _5dd80839,
    name: "c-cluster-monitoring-route-receiver-id"
  }, {
    path: "/c/:cluster/auth/roles/:resource/create",
    component: _8bab70aa,
    name: "c-cluster-auth-roles-resource-create"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/serial",
    component: _36c7da35,
    name: "c-cluster-harvester-console-uid-serial"
  }, {
    path: "/c/:cluster/harvester/console/:uid?/vnc",
    component: _a5ee9a8c,
    name: "c-cluster-harvester-console-uid-vnc"
  }, {
    path: "/c/:cluster/monitoring/alertmanagerconfig/:alertmanagerconfigid/receiver",
    component: _260c3b22,
    name: "c-cluster-monitoring-alertmanagerconfig-alertmanagerconfigid-receiver"
  }, {
    path: "/c/:cluster/auth/roles/:resource/:id?",
    component: _075c16ca,
    name: "c-cluster-auth-roles-resource-id"
  }, {
    path: "/c/:cluster/monitoring/monitor/:namespace/:id?",
    component: _60804912,
    name: "c-cluster-monitoring-monitor-namespace-id"
  }, {
    path: "/c/:cluster/navlinks/:group?",
    component: _a8545ea6,
    name: "c-cluster-navlinks-group"
  }, {
    path: "/c/:cluster/:product",
    component: _3be0f422,
    name: "c-cluster-product"
  }, {
    path: "/c/:cluster/:product/members",
    component: _51c2f379,
    name: "c-cluster-product-members"
  }, {
    path: "/c/:cluster/:product/namespaces",
    component: _6a9614ab,
    name: "c-cluster-product-namespaces"
  }, {
    path: "/c/:cluster/:product/projectsnamespaces",
    component: _384e04a5,
    name: "c-cluster-product-projectsnamespaces"
  }, {
    path: "/c/:cluster/:product/:resource",
    component: _3e7f398d,
    name: "c-cluster-product-resource"
  }, {
    path: "/c/:cluster/:product/:resource/create",
    component: _8dc77a5e,
    name: "c-cluster-product-resource-create"
  }, {
    path: "/c/:cluster/:product/:resource/:id",
    component: _1bb83b35,
    name: "c-cluster-product-resource-id"
  }, {
    path: "/c/:cluster/:product/:resource/:namespace/:id?",
    component: _877a2f48,
    name: "c-cluster-product-resource-namespace-id"
  }, {
    path: "/",
    component: _c2aa1534,
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
