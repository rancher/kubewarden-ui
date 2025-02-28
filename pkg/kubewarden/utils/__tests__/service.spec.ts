import { proxyUrl, proxyUrlFromBase } from '@kubewarden/utils/service';

describe('proxyUrlFromBase', () => {
  it('should build the proxy URL correctly when a path is provided', () => {
    const base = 'http://example.com/api';
    const scheme = 'http';
    const name = 'my-service';
    const port = 8080;
    const path = 'some/path';
    // Expected: cleanBase remains "http://example.com/api"
    // schemaNamePort becomes "http:my-service:8080"
    // cleanPath becomes "/some/path"
    // Final URL: "http://example.com/api/http:my-service:8080/proxy/some/path"
    const expected = 'http://example.com/api/http:my-service:8080/proxy/some/path';

    expect(proxyUrlFromBase(base, scheme, name, port, path)).toBe(expected);
  });

  it('should remove trailing slashes from the base URL', () => {
    const base = 'http://example.com/api///';
    const scheme = 'http';
    const name = 'my-service';
    const port = 8080;
    const path = 'some/path';
    // Trailing slashes in base should be removed.
    const expected = 'http://example.com/api/http:my-service:8080/proxy/some/path';

    expect(proxyUrlFromBase(base, scheme, name, port, path)).toBe(expected);
  });

  it('should default the path to "/" if no path is provided', () => {
    const base = 'http://example.com/api';
    const scheme = 'http';
    const name = 'my-service';
    const port = 3000;
    // When path is undefined, cleanPath becomes "/" (an empty string replaced and then prefixed with "/").
    const expected = 'http://example.com/api/http:my-service:3000/proxy/';

    expect(proxyUrlFromBase(base, scheme, name, port)).toBe(expected);
  });

  it('should encode the scheme, name, and port correctly', () => {
    const base = 'http://example.com/api';
    const scheme = 'http';
    const name = 'my service'; // space in name
    const port = 8080;
    const path = '/some/path';
    // encodeURIComponent('my service') becomes "my%20service"
    // Expected URL: "http://example.com/api/http:my%20service:8080/proxy/some/path"
    const expected = 'http://example.com/api/http:my%20service:8080/proxy/some/path';

    expect(proxyUrlFromBase(base, scheme, name, port, path)).toBe(expected);
  });
});

describe('proxyUrl', () => {
  it('should construct the proxy URL using the service.view and metadata.name', () => {
    const service = {
      links:    { view: 'http://example.com/api/my-service' },
      metadata: { name: 'my-service' }
    };
    const port = 3000;
    // For service.view = "http://example.com/api/my-service", lastIndexOf('/') returns the index before "my-service".
    // view.slice(0, idx) gives "http://example.com/api"
    // proxyUrlFromBase is then called with that base, "http", "my-service", and port 3000.
    // Expected URL: "http://example.com/api/http:my-service:3000/proxy/"
    const expected = 'http://example.com/api/http:my-service:3000/proxy/';

    expect(proxyUrl(service, port)).toBe(expected);
  });

  it('should handle missing metadata.name by encoding "undefined"', () => {
    const service = {
      links:    { view: 'http://example.com/api/my-service' },
      metadata: {}
    };
    const port = 3000;
    // When name is undefined, encodeURIComponent(undefined) yields the string "undefined".
    // Expected URL: "http://example.com/api/http:undefined:3000/proxy/"
    const expected = 'http://example.com/api/http:undefined:3000/proxy/';

    expect(proxyUrl(service, port)).toBe(expected);
  });
});
