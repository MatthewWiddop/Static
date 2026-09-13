
export const MIN_SPACES = 1;
export const MAX_SPACES = 4;
const SPACE = ' ';

export const countLeadingSpaces = (str: string) => {
  return str.length - str.trimStart().length;
}

export const calcBlockIndent = (spaces: number): number => {
  if (spaces > MAX_SPACES) {
    return MIN_SPACES;
  }
  return Math.min(Math.min(spaces, MAX_SPACES), MIN_SPACES);
}

export const isEmptyLine = (line: string): boolean => {
  return line.trim() === '';
}

export const trimIndentation = (text: string, max: number): string => {
  let i;
  for (i = 0; i < max && text[i] === SPACE; i++) { }
  return text.slice(i);
}

