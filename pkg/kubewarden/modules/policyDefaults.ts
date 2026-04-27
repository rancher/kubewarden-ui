import isEmpty from 'lodash/isEmpty';

import { KUBEWARDEN_APPS } from '@kubewarden/types';

type PolicyServerLike = {
  id?: string;
  metadata?: {
    annotations?: Record<string, string>;
  };
};

type PolicyLike = {
  spec?: {
    mode?: string;
    policyServer?: string;
  };
};

type QuestionLike = {
  type?: string;
  default?: any;
};

/**
 * Apply create-time defaults for policy mode and policy server selection.
 */
export function applyCreatePolicyDefaults(policy: PolicyLike, policyServers: PolicyServerLike[] = []): void {
  if (!policy?.spec) {
    return;
  }

  policy.spec.mode = 'protect';

  if (isEmpty(policyServers)) {
    return;
  }

  const defaultPolicyServer = policyServers.find((ps) => {
    return ps.metadata?.annotations?.['meta.helm.sh/release-name'] === KUBEWARDEN_APPS.RANCHER_DEFAULTS;
  });

  if (policy.spec.policyServer === undefined && defaultPolicyServer?.id !== undefined) {
    policy.spec.policyServer = defaultPolicyServer.id;
  }
}

/**
 * Resolve question defaults before first render/write.
 */
export function resolveQuestionDefault(question: QuestionLike): any {
  let defaultValue = question?.default;

  if (question?.type === 'boolean' && typeof defaultValue === 'string') {
    defaultValue = defaultValue === 'true';
  }

  return defaultValue;
}

/**
 * Default values are only injected when the value is currently unset.
 */
export function shouldApplyQuestionDefault(currentValue: any, defaultValue: any): boolean {
  if (currentValue !== undefined) {
    return false;
  }
  if (defaultValue === undefined || defaultValue === null || defaultValue === '') {
    return false;
  }
  if (typeof defaultValue === 'object' && Object.keys(defaultValue).length === 0) {
    return false;
  }

  return true;
}
