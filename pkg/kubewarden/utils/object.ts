import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

export function removeEmptyAttrs(obj: any) {
  Object.keys(obj).forEach((key: any) => {
    const value = obj[key];

    if ( value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length) || (isObject(value) && isEmpty(value)) ) {
      delete obj[key];
    } else if ( isObject(value) ) {
      removeEmptyAttrs(value);
    }
  });

  return obj;
}
