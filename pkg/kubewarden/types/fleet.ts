import { V1LabelSelector, V1ObjectMeta } from '@kubernetes/client-node';

import { Label, Condition } from './core';

export type FleetGitRepo = {
  apiVersion: string,
  kind: string,
  metadata: V1ObjectMeta,
  spec: {
    branch?: string,
    correctDrift?: {
      enabled?: boolean,
      force?: string,
      keepFailHistory?: string,
    },
    insecureSkipTLSVerify?: boolean,
    paths?: string[],
    repo?: string,
    targets?: [
      {
        clusterName?: string,
      },
      {
        clusterGroup?: string,
        clusterGroupSelector?: V1LabelSelector,
        clusterName?: string,
        clusterSelector?: V1LabelSelector,
        name?: string,
      }
    ],
    caBundle?: string,
    clientSecretName?: string,
    forceSyncGeneration?: string,
    helmRepoURLRegex?: string,
    helmSecretName?: string,
    helmSecretNameForPaths?: string,
    imageScanCommit?: {
      authorEmail?: string,
      authorName?: string,
      messageTemplate?: string,
    },
    imageScanInterval?: string,
    keepResources?: string,
    paused?: string,
    pollingInterval?: string,
    revision?: string,
    serviceAccount?: string,
    targetNamespace?: string,
  },
  status: {
    commit?: string,
    conditions: Condition[],
    desiredReadyClusters?: number,
    display?: {
      readyBundleDeployments: string,
    },
    gitJobStatus?: string,
    lastSyncedImageScanTime?: string,
    observedGeneration?: number,
    readyClusters?: number,
    resourceCounts?: {
      desiredReady: number,
      missing: number,
      modified: number,
      notReady: number,
      orphaned: number,
      ready: number,
      unknown: number,
      waitApplied: number
    },
    resources?: [
      {
        apiVersion: string,
        id: string,
        kind: string,
        name: string,
        state: string,
        type: string,
      },
    ],
    summary?: {
      desiredReady: number,
      ready: number
    }
  }
}

export type FleetBundle = {
  apiVersion: string,
  kind: string,
  metadata: V1ObjectMeta,
  spec: {
    correctDrift: {
      enabled: boolean,
      force: boolean,
      keepFailHistory: boolean
    },
    defaultNamespace: string,
    dependsOn: [
      {
        name: string,
        selector: V1LabelSelector
      }
    ],
    diff: {
      comparePatches: [
        {
          apiVersion: string,
          jsonPointers: string[],
          kind: string,
          name: string,
          namespace: string,
          operations: [
            {
              op: string,
              path: string,
              value: string
            }
          ]
        }
      ]
    },
    forceSyncGeneration: number,
    helm: {
      atomic: boolean,
      chart: string,
      disableDNS: boolean,
      disablePreProcess: boolean,
      force: boolean,
      maxHistory: number,
      releaseName: string,
      repo: string,
      skipSchemaValidation: boolean,
      takeOwnership: boolean,
      timeoutSeconds: number,
      values: any,
      valuesFiles: string[],
      valuesFrom: [
        {
          configMapKeyRef: {
            key: string,
            name: string,
            namespace: string
          },
          secretKeyRef: {
            key: string,
            name: string,
            namespace: string
          }
        }
      ],
      version: string,
      waitForJobs: boolean
    },
    ignore: {
      conditions: any
    },
    keepResources: boolean,
    kustomize: {
      dir: string
    },
    namespace: string,
    namespaceAnnotations: Label,
    namespaceLabels: Label,
    paused: boolean,
    resources: [
      {
        content: string,
        encoding: string,
        name: string
      }
    ],
    rolloutStrategy: {
      autoPartitionSize: string,
      maxUnavailable: string,
      maxUnavailablePartitions: string,
      partitions: [
        {
          clusterGroup: string,
          clusterGroupSelector: V1LabelSelector,
          clusterName: string,
          clusterSelector: V1LabelSelector,
          maxUnavailable: string,
          name: string
        }
      ]
    },
    serviceAccount: string,
    targetRestrictions: [
      {
        clusterGroup: string,
        clusterGroupSelector: V1LabelSelector,
        clusterName: string,
        clusterSelector: V1LabelSelector,
        name: string
      }
    ],
    targets: [
      {
        clusterGroup: string,
        clusterGroupSelector: V1LabelSelector,
        clusterName: string,
        clusterSelector: V1LabelSelector,
        correctDrift: {
          enabled: boolean,
          force: boolean,
          keepFailHistory: boolean
        },
        defaultNamespace: string,
        diff: {
          comparePatches: [
            {
              apiVersion: string,
              jsonPointers: [
                string
              ],
              kind: string,
              name: string,
              namespace: string,
              operations: [
                {
                  op: string,
                  path: string,
                  value: string
                }
              ]
            }
          ]
        },
        doNotDeploy: boolean,
        forceSyncGeneration: number,
        helm: {
          atomic: boolean,
          chart: string,
          disableDNS: boolean,
          disablePreProcess: boolean,
          force: boolean,
          maxHistory: number,
          releaseName: string,
          repo: string,
          skipSchemaValidation: boolean,
          takeOwnership: boolean,
          timeoutSeconds: number,
          values: any,
          valuesFiles: string[],
          valuesFrom: [
            {
              configMapKeyRef: {
                key: string,
                name: string,
                namespace: string
              },
              secretKeyRef: {
                key: string,
                name: string,
                namespace: string
              }
            }
          ],
          version: string,
          waitForJobs: boolean
        },
        ignore: {
          conditions: any
        },
        keepResources: boolean,
        kustomize: {
          dir: string
        },
        name: string,
        namespace: string,
        namespaceAnnotations: Label,
        namespaceLabels: Label,
        serviceAccount: string,
        yaml: {
          overlays: string[]
        }
      }
    ],
    yaml: {
      overlays: string[]
    }
  }
}