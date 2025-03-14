export interface Version {
  name: string,
  home?: string,
  version: string,
  description: string,
  keywords?: string[],
  maintainers?: [
    {
      name?: string,
      email?: string,
      url?: string,
    }
  ],
  icon?: string,
  apiVersion: string,
  appVersion: string,
  annotations?: {[key: string]: string},
  kubeVersion: string,
  dependencies?: [
    {
      name?: string,
      version?: string,
      repository?: string,
      condition?: string,
    }
  ],
  type: string,
  urls?: string[],
  created?: string,
  digest?: string,
  key?: string,
  repoType?: string,
  repoName?: string,
}

export interface VersionInfo {
  readme: string;
  values: any;
  questions: {
    questions: [];
  };
  chart: ChartInfo;
}

export interface Chart {
  key: string,
  type: string,
  id: string,
  certified?: string,
  description?: string,
  sideLabel?: null,
  repoType: string,
  repoName: string,
  repoNameDisplay?: string,
  certifiedSort?: number,
  icon?: string,
  color?: string,
  chartType: string,
  chartName: string,
  chartNameDisplay?: string,
  chartDescription?: string,
  repoKey?: string,
  versions?: Version[],
  categories?: string[],
  deprecated?: boolean,
  hidden?: boolean,
  targetNamespace?: string,
  targetName?: string,
  provides?: string[],
  windowsIncompatible?: boolean,
  deploysOnWindows?: boolean
}

/**
 * This is essentially the Chart.yaml file in the Helm chart
 */
export interface ChartInfo {
  annotations?: {[key: string]: string}
  apiVersion: string
  appVersion: string
  description?: string
  home?: string
  keywords?: string[]
  name: string
  sources?: string[]
  version: string
}