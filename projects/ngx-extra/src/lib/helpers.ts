export function cleanNullishFromObject(obj?: object): Record<string, any> {
  if (obj === undefined) {
    return {};
  }

  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

export function hasNullishInObject(obj: object): boolean {
  return Object.values(obj).some((val) => val === null || val === undefined);
}
