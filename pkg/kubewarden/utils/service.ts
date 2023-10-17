export function proxyUrlFromBase(base: any, scheme: any, name: any, port: any, path?: any) {
  const schemaNamePort = (scheme ? `${ escape(scheme) }:` : '') + escape(name) + (port ? `:${ escape(port) }` : '');

  const cleanPath = `/${ (path || '').replace(/^\/+/g, '') }`;
  const cleanBase = base.replace(/\/+$/g, '');

  const out = `${ cleanBase }/${ schemaNamePort }/proxy${ cleanPath }`;

  return out;
}
