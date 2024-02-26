import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

export function removeEmptyAttrs(obj: any): any {
  Object.keys(obj).forEach((key: any) => {
    const value = obj[key];

    // Check for value being empty, null, or an empty array
    if ( value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length) ) {
      delete obj[key];
    } else if ( isObject(value) ) {
      // Recursively clean the object
      removeEmptyAttrs(value);

      // After cleaning, if the object is empty, delete it
      if ( isEmpty(value) ) {
        delete obj[key];
      }
    }
  });

  // Added check: If the parent object is now empty, return null to signal removal
  if ( isEmpty(obj) ) {
    return null;
  }

  return obj;
}
