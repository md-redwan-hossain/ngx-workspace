/**
 * Removes all null and undefined values from an object.
 * @param obj - The object to clean. If null or undefined, returns an empty object.
 * @returns A new object with all nullish values filtered out.
 */
export function cleanNullishFromObject(obj?: object): Record<string, any> {
  if (obj == null) return {};
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

/**
 * Checks if an object contains any null or undefined values.
 * @param obj - The object to check. If null or undefined, returns false.
 * @returns True if the object contains at least one nullish value, false otherwise.
 */
export function hasNullishInObject(obj?: object): boolean {
  if (obj == null) return false;
  return Object.values(obj).some((val) => val == null);
}
