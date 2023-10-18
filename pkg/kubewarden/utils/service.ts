export function proxyUrl(service: any, port: number): string {
  const view: string = service?.links['view'];
  const idx: number = view.lastIndexOf(`/`);

  return proxyUrlFromBase(view.slice(0, idx), 'http', service?.metadata.name, port);
}

export function proxyUrlFromBase(base: string, scheme: string, name: string, port: number, path?: any): string {
  const schemaNamePort = (scheme ? `${ encodeURIComponent(scheme) }:` : '') + encodeURIComponent(name) + (port ? `:${ encodeURIComponent(port) }` : '');

  const cleanPath = `/${ (path || '').replace(/^\/+/g, '') }`;
  const cleanBase = base.replace(/\/+$/g, '');

  const out = `${ cleanBase }/${ schemaNamePort }/proxy${ cleanPath }`;

  return out;
}
