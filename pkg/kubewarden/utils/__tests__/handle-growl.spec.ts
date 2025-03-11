import { handleGrowl, GrowlConfig } from '@kubewarden/utils/handle-growl';

describe('handleGrowl', () => {
  let store: { dispatch: jest.Mock };

  beforeEach(() => {
    store = { dispatch: jest.fn() };
  });

  it('should dispatch using error.data when available and default type ("Error")', () => {
    const config: GrowlConfig = {
      error: {
        data: {
          _statusText: 'Data Status',
          message:     'Data error message'
        },
        _statusText: 'Fallback Status',
        message:     'Fallback message'
      },
      store
    };

    handleGrowl(config);

    expect(store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      {
        title:   'Data Status',
        message: 'Data error message',
        timeout: 5000,
      },
      { root: true }
    );
  });

  it('should dispatch using error when error.data is not available and use provided type', () => {
    const config: GrowlConfig = {
      error: {
        _statusText: 'Error Status',
        message:     'Error message'
      },
      store,
      type: 'Warning'
    };

    handleGrowl(config);

    expect(store.dispatch).toHaveBeenCalledWith(
      'growl/warning',
      {
        title:   'Error Status',
        message: 'Error message',
        timeout: 5000,
      },
      { root: true }
    );
  });

  it('should fallback title to type when _statusText is empty in error.data', () => {
    const config: GrowlConfig = {
      error: {
        data: {
          _statusText: '', // empty _statusText
          message:     'Data message'
        },
        _statusText: 'Fallback should not be used',
        message:     'Fallback message'
      },
      store,
      type: 'Info'
    };

    handleGrowl(config);

    expect(store.dispatch).toHaveBeenCalledWith(
      'growl/info',
      {
        title:   'Info', // fallback to provided type since _statusText is empty
        message: 'Data message',
        timeout: 5000,
      },
      { root: true }
    );
  });

  it('should default type to "Error" when type is not provided and error._statusText is empty', () => {
    const config: GrowlConfig = {
      error: {
        _statusText: '', // empty _statusText, so should fallback to default type
        message:     'Error message'
      },
      store
      // no type provided so default is "Error"
    };

    handleGrowl(config);

    expect(store.dispatch).toHaveBeenCalledWith(
      'growl/error',
      {
        title:   'Error', // fallback to default type because _statusText is empty
        message: 'Error message',
        timeout: 5000,
      },
      { root: true }
    );
  });
});
