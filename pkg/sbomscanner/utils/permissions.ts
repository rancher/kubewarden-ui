import { RESOURCE } from '@pkg/types';
export function getPermissions(getters: any) {
    const resourceMethods = getters['cluster/schemaFor'](RESOURCE.REGISTRY)?.resourceMethods || [];
    const canEdit = resourceMethods.includes('PUT');
    const canDelete = resourceMethods.includes('DELETE');
    return {
        canEdit,
        canDelete
    }
}