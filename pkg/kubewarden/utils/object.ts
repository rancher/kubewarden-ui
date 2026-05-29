import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';

export function removeEmptyAttrs(obj: any): any {
  Object.keys(obj).forEach((key: any) => {
    const value = obj[key];

    // Check for value being empty, null, or an empty array
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
      delete obj[key];
    } else if (Array.isArray(value)) {
      // Arrays are treated as leaf values. Items inside an array (e.g.
      // `apiGroups: ['']` meaning the core Kubernetes API group) may be
      // semantically meaningful even when "empty", and using `delete` on an
      // array index would produce a sparse hole that serializes to `null`.
      // Leave non-empty arrays as-is.
    } else if (isObject(value)) {
      // Recursively clean the object
      removeEmptyAttrs(value);

      // After cleaning, if the object is empty, delete it
      if (isEmpty(value)) {
        delete obj[key];
      }
    }
  });

  // Added check: If the parent object is now empty, return null to signal removal
  if (isEmpty(obj)) {
    return null;
  }

  return obj;
}
