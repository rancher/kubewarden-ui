export interface GrowlConfig {
  error: {
    data?: {
      _statusText: String,
      message: String
    }
    _statusText: String,
    message: String
  },
  store?: any,
  type?: String
}

export function handleGrowl(config: GrowlConfig): void {
  const error = config.error?.data || config.error;
  const type = config.type || 'Error';

  config.store.dispatch(`growl/${ type.toLowerCase() }`, {
    title:   error._statusText || type,
    message: error.message,
    timeout: 5000,
  }, { root: true });
}
