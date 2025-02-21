export default [
  {
    id:    'namespace',
    type:  'schema',
    links: {
      collection: 'https://localhost:8005/v1/namespaces',
      self:       'https://localhost:8005/v1/schemas/namespace'
    },
    description:     'Namespace provides a scope for Names. Use of multiple namespaces is optional.',
    pluralName:      'namespaces',
    resourceMethods: [
      'GET',
      'DELETE',
      'PUT',
      'PATCH'
    ],
    collectionMethods: [
      'GET',
      'GET',
      'GET',
      'POST'
    ],
    attributes: {
      group:      '',
      kind:       'Namespace',
      namespaced: false,
      resource:   'namespaces',
      verbs:      [
        'create',
        'delete',
        'get',
        'list',
        'patch',
        'update',
        'watch'
      ],
      version: 'v1'
    }
  }
];