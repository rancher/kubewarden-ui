/* eslint-disable no-unused-vars */
export enum DATA_ANNOTATIONS {
  CONTEXT_AWARE = 'kubewarden/contextAwareResources',
  RULES = 'kubewarden/rules',
  MUTATION = 'kubewarden/mutation',
  RESOURCES = 'kubewarden/resources',
  QUESTIONS = 'kubewarden/questions-ui'
}
/* eslint-enable no-unused-vars */

/* eslint-disable camelcase */
export interface ArtifactHubPackage {
  package_id: string;
  name: string;
  normalized_name: string;
  category?: number;
  is_operator?: boolean;
  display_name: string;
  description: string;
  keywords?: string[];
  home_url: string;
  readme: string;
  install: string;
  links: [
    {
      url: string;
      name: string;
    }
  ];
  data?: {
    [DATA_ANNOTATIONS.CONTEXT_AWARE]?: string
    [DATA_ANNOTATIONS.RULES]?: string;
    [DATA_ANNOTATIONS.MUTATION]?: string;
    [DATA_ANNOTATIONS.RESOURCES]?: string;
    [DATA_ANNOTATIONS.QUESTIONS]?: string;
  };
  version: string;
  available_versions: [
    {
      version: string;
      contains_security_updates?: boolean;
      prerelease?: boolean;
    }
  ];
  deprecated?: boolean;
  contains_security_updates?: boolean;
  prerelease?: boolean;
  license: string;
  signed?: boolean;
  signatures?: string[];
  containers_images?: [
    {
      name: string;
      image: string;
      whitelisted: boolean;
    }
  ];
  all_containers_images_whitelisted?: boolean;
  provider?: string;
  has_values_schema?: boolean;
  has_changelog?: boolean;
  maintainers?: [
    {
      name: string;
      email: string;
    }
  ];
  recommendations?: [
    {
      url: string;
    }
  ];
  repository: {
    repository_id: string;
    name: string;
    display_name: string;
    url: string;
    branch: string;
    private?: boolean;
    kind: number;
    verified_publisher?: boolean;
    official?: boolean;
    cncf?: boolean;
    scanner_disabled?: boolean;
    organization_name?: string;
    organization_display_name?: string;
  };
  stats?: {
    subscriptions: number;
    webhooks: number;
  };
  production_organizations_count?: number;
}
/* eslint-enable camelcase */
