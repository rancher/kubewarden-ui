export function proxyUrlFromBase(base: any, scheme: any, name: any, port: any, path?: any) {
  const schemaNamePort = (scheme ? `${ encodeURIComponent(scheme) }:` : '') + encodeURIComponent(name) + (port ? `:${ encodeURIComponent(port) }` : '');

  const cleanPath = `/${ (path || '').replace(/^\/+/g, '') }`;
  const cleanBase = base.replace(/\/+$/g, '');

  const out = `${ cleanBase }/${ schemaNamePort }/proxy${ cleanPath }`;

  return out;
}
