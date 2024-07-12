import {
  CATALOG,
  MANAGEMENT
} from '@shell/config/types';

export function isAdminUser(getters: any) {
  const canEditSettings = (getters['cluster/schemaFor'](MANAGEMENT.SETTING)?.resourceMethods || []).includes('PUT');
  const canEditFeatureFlags = (getters['cluster/schemaFor'](MANAGEMENT.FEATURE)?.resourceMethods || []).includes('PUT');
  const canInstallApps = (getters['cluster/schemaFor'](CATALOG.APP)?.resourceMethods || []).includes('PUT');
  const canAddRepos = (getters['cluster/schemaFor'](CATALOG.CLUSTER_REPO)?.resourceMethods || []).includes('PUT');
  const canPutHelmOperations = (getters['cluster/schemaFor'](CATALOG.OPERATION)?.resourceMethods || []).includes('PUT');

  return canEditSettings && canEditFeatureFlags && canInstallApps && canAddRepos && canPutHelmOperations;
}