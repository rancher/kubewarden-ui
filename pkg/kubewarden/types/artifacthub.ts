/* eslint-disable no-unused-vars */
export enum DATA_ANNOTATIONS {
  CONTEXT_AWARE = 'kubewarden/contextAwareResources',
  RULES = 'kubewarden/rules',
  MUTATION = 'kubewarden/mutation',
  RESOURCES = 'kubewarden/resources',
  QUESTIONS = 'kubewarden/questions-ui'
}
/* eslint-enable no-unused-vars */


export interface Link {
  url: string
  name: string
}

export interface Data {
  'kubewarden/rules': string
  'kubewarden/mutation'?: string
  'kubewarden/contextAwareResources'?: string
  'kubewarden/resources': string
  'kubewarden/questions-ui': string
}

export interface AvailableVersion {
  version: string
  contains_security_updates: boolean
  prerelease: boolean
  ts: number
}

export interface ContainersImage {
  name: string
  image: string
  whitelisted: boolean
}

export interface Maintainer {
  name: string
  email: string
}

export interface Recommendation {
  url: string
}

export interface Repository {
  repository_id: string
  name: string
  display_name: string
  url: string
  branch?: string
  private?: boolean
  kind: number
  verified_publisher: boolean
  official: boolean
  cncf: boolean
  scanner_disabled: boolean
  organization_name: string
  organization_display_name: string
}

export interface Stats {
  subscriptions: number
  webhooks: number
}

export interface ArtifactHubPackage {
  package_id: string
  name: string
  normalized_name: string
  category: number
  stars: number
  display_name: string
  description: string
  version: string
  license: string
  deprecated: boolean
  has_values_schema: boolean
  signed: boolean
  signatures: string[]
  all_containers_images_whitelisted: boolean
  production_organizations_count: number
  ts: number
  repository: Repository
}

export interface ArtifactHubPackageDetails {
  package_id: string
  name: string
  normalized_name: string
  category: number
  is_operator: boolean
  display_name: string
  description: string
  keywords: string[]
  home_url: string
  readme: string
  install: string
  links: Link[]
  data: Data
  version: string
  available_versions: AvailableVersion[]
  deprecated: boolean
  contains_security_updates: boolean
  prerelease: boolean
  license: string
  signed: boolean
  signatures: string[]
  containers_images: ContainersImage[]
  all_containers_images_whitelisted: boolean
  provider: string
  has_values_schema: boolean
  has_changelog: boolean
  ts: number
  maintainers: Maintainer[]
  recommendations: Recommendation[]
  repository: Repository
  stats: Stats
  production_organizations_count: number
}

