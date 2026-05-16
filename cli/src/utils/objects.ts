export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function compact<T>(values: Array<T | undefined | null | false>): T[] {
  return values.filter(Boolean) as T[];
}

export function mergeRecords<T>(
  records: Array<Record<string, T> | undefined>,
): Record<string, T> {
  return Object.assign({}, ...records.filter(Boolean));
}

export function parseCsv(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sortByPriority<T extends { priority?: number; id: string }>(values: T[]): T[] {
  return [...values].sort((left, right) => {
    const priority = (right.priority ?? 0) - (left.priority ?? 0);
    return priority === 0 ? left.id.localeCompare(right.id) : priority;
  });
}
