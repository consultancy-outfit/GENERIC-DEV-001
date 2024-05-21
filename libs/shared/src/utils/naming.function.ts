export function toTitleCase(input: string): string {
  const result = input?.replace(/([A-Z])/g, ' $1');
  return result?.charAt(0)?.toUpperCase() + result?.slice(1);
}

export function toSentenceCase(input: string): string {
  const result = input?.replace(/([A-Z])/g, ' $1');
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

export function toCapitalizeFirst(input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function toPascalCase(input: string): string {
  const words = input.split(/[\s-_/]+/);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toKebabCase(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '-');
}

export function toCamelCase(input: string): string {
  const words = input.split(/[\s-_/]+/);
  const camelWords = words.map((word, index) =>
    index === 0
      ? word.toLowerCase()
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  return camelWords.join('');
}

export function toSnakeCase(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '_');
}

export function toConstantCase(input: string): string {
  return input.toUpperCase().replace(/\s+/g, '_');
}
export function fromCase(
  input: string,
  targetCase:
    | 'TitleCase'
    | 'SentenceCase'
    | 'PascalCase'
    | 'kebab-case'
    | 'camelCase'
    | 'snake_case'
    | 'CONSTANT_CASE'
): string {
  switch (targetCase) {
    case 'TitleCase':
      return toTitleCase(input);
    case 'SentenceCase':
      return toSentenceCase(input);
    case 'PascalCase':
      return toPascalCase(input);
    case 'kebab-case':
      return toKebabCase(input);
    case 'camelCase':
      return toCamelCase(input);
    case 'snake_case':
      return toSnakeCase(input);
    case 'CONSTANT_CASE':
      return toConstantCase(input);
    default:
      return input;
  }
}
