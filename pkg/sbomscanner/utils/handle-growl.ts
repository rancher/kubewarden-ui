export interface GrowlConfig {
  error: {
    data?: {
      _statusText: string;
      message: string;
    };
    _statusText: string;
    message: string;
  };
  store?: any;
  type?: string;
}

export function handleGrowl(config: GrowlConfig): void {
  const error = config.error?.data || config.error;
  const type = config.type || 'Error';

  config.store.dispatch(
    `growl/${ type.toLowerCase() }`,
    {
      title:   error._statusText || type,
      message: error.message,
      timeout: 5000,
    },
    { root: true }
  );
}
