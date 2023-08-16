interface GrowlConfig {
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

  config.store.dispatch(`growl/${ config.type || 'error' }`, {
    title:   error._statusText,
    message: error.message,
    timeout: 5000,
  }, { root: true });
}
