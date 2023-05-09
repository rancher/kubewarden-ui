interface GrowlConfig {
  error: {
    data?: {
      _statusText: String,
      message: String
    }
    _statusText: String,
    message: String
  },
  store: any
}

export function handleGrowlError(config: GrowlConfig): void {
  const error = config.error?.data || config.error;

  config.store.dispatch('growl/error', {
    title:   error._statusText,
    message: error.message,
    timeout: 5000,
  }, { root: true });
}