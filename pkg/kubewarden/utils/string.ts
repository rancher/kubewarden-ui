/**
 * Takes a k8s dns entry and returns the port
 * @param inputString | dns entry e.g. 'my-open-telemetry-collector.jaeger.svc.cluster.local:4317'
 * @returns `number | null | void` | Returns the port at the end of a string
 */
export function extractPortNumber(inputString: any): number | null | void {
  const portPattern = /:(\d+)$/;
  const match = inputString.match(portPattern);

  if ( match && match[1] ) {
    return parseInt(match[1], 10);
  } else {
    return null;
  }
}
