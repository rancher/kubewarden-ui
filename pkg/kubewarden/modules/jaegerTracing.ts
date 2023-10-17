import isEmpty from 'lodash/isEmpty';

import { KUBEWARDEN, JaegerConfig, PolicyTrace, Tag } from '../types';
import { proxyUrlFromBase } from '../utils/service';

/** TODO: Update the `any` types throughout this file */

export async function jaegerTraces(config: JaegerConfig): Promise<any> {
  const {
    store, queryService, resource, relatedPolicies, policy, time
  } = config;

  try {
    const proxy = proxyUrl(queryService, 16686);

    const promises = [];

    if ( !isEmpty(relatedPolicies) ) {
      relatedPolicies?.forEach((p: any) => {
        const hash = jaegerTraceRequest(store, proxy, p, time);

        if ( hash ) {
          promises.push(hash);
        }
      });
    } else if ( policy ) {
      promises.push(jaegerTraceRequest(store, proxy, policy, time));
    } else {
      throw new Error('Policy is undefined');
    }

    let res = await Promise.all(promises);

    res = res.flatMap(o => o?.data);

    return scaffoldPolicyTrace(store, res, resource, relatedPolicies, policy);
  } catch (e) {
    console.warn(`Error fetching Jaeger traces: ${ e }`); // eslint-disable-line no-console
  }

  return null;
}

export function jaegerPolicyName(policy: any) {
  let out = null;

  switch (policy?.kind) {
  case 'ClusterAdmissionPolicy':
    out = `clusterwide-${ policy?.metadata?.name }`;
    break;

  case 'AdmissionPolicy':
    out = `namespaced-${ policy?.metadata?.namespace }-${ policy?.metadata?.name }`;
    break;

  default:
    break;
  }

  return out;
}

function jaegerTraceRequest(store: any, proxyUrl: any, policy: any, time?: any) {
  let apiPath = null;

  const name = jaegerPolicyName(policy);
  const lookbackTime = time || '2d';

  const options = `lookback=${ lookbackTime }&tags={"policy_id"%3A"${ name }"}`;
  const operation = policy?.spec?.mode === 'monitor' ? 'policy_eval' : 'validation';

  // The service `kubewarden-policy-server` is **not** a k8s Service
  apiPath = `api/traces?service=kubewarden-policy-server&operation=${ operation }&${ options }`;
  const JAEGER_PATH = `${ proxyUrl + apiPath }`;

  return store.dispatch('cluster/request', { url: JAEGER_PATH });
}

export function proxyUrl(service: any, port: number) {
  const view = service?.links['view'];
  const idx = view.lastIndexOf(`/`);

  return proxyUrlFromBase(view.slice(0, idx), 'http', service?.metadata.name, port);
}

function scaffoldPolicyTrace(store: any, traces: any, resource: any, relatedPolicies: any, policy: any): any {
  const out = [];

  function filterTraces(p: any) {
    const policyName = jaegerPolicyName(p);

    return traces.reduce((acc: any, trace: any): PolicyTrace[] => {
      let out = {};

      const validationSpan = trace.spans.find((span: any) => span.operationName === 'validation');
      const matchedTag = validationSpan?.tags?.find((tag: any) => tag?.key === 'policy_id' && tag?.value === policyName);

      if ( matchedTag ) {
        const convertedTags = convertTagsToObject(validationSpan.tags);

        out = {
          id:              trace.traceID,
          allowed:         convertedTags.allowed,
          mode:            p.spec.mode,
          name:            convertedTags.name,
          operation:       convertedTags.operation,
          kind:            convertedTags.kind,
          namespace:       convertedTags.namespace || null,
          startTime:       validationSpan.startTime,
          duration:        validationSpan.duration,
          responseMessage: convertedTags.response_message,
          responseCode:    convertedTags.response_code,
          mutated:         convertedTags.mutated
        };
      }

      if ( !isEmpty(out) ) {
        acc.push(out);
        store.dispatch('kubewarden/updatePolicyTraces', { policyName: p.metadata.name, updatedTrace: out });
      }

      return acc;
    }, []);
  }

  if ( resource === KUBEWARDEN.POLICY_SERVER ) {
    for ( const relatedPolicy of relatedPolicies ) {
      const relatedTraces = filterTraces(relatedPolicy);

      if ( !isEmpty(relatedTraces) ) {
        out.push({ policyName: relatedPolicy.metadata.name, traces: relatedTraces });
      }
    }
  } else {
    const relatedTraces = filterTraces(policy);

    if ( !isEmpty(relatedTraces) ) {
      out.push({ policyName: policy.metadata.name, traces: relatedTraces });
    }
  }

  return out;
}

export function convertTagsToObject(arr: Tag[]): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};

  for (const item of arr) {
    switch (item.type) {
    case 'string':
      result[item.key] = item.value as string;
      break;
    case 'int64':
      result[item.key] = parseInt(item.value as string, 10);
      break;
    case 'float64':
      result[item.key] = parseFloat(item.value as string);
      break;
    case 'bool':
      result[item.key] = item.value === 'true';
      break;
    default:
      result[item.key] = item.value;
    }
  }

  return result;
}
