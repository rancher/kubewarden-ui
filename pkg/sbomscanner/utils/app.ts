// Utility method to decode base64 strings
export function decodeBase64(str: string) {
  try {
    return atob(str);
  } catch (error) {
    console.warn(error);

    return str; // Return original string if decoding fails
  }
}