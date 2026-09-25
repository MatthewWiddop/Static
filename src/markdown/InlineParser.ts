import type { InlineCodeNode, InlineNode, TextNode } from './ast.ts';
import { countRepeatingChar, isEmptyLine, punctuation } from '../utils.ts';
import type { Cursor } from './Cursor.ts';

export type DelimiterType = '*' | '_' | '[' | '![';
const DELIMITERS = ['*', '_', '[', '!['];
const SPACE = ' ';

export type Delimiter = {
  type: DelimiterType;
  canOpen: boolean;
  canClose: boolean;
  length: number;
  active: boolean;
}

export const isLeftFlanking = (prevChar: string, nextChar: string): boolean => {
  return (!punctuation.includes(nextChar) || `${punctuation} `.includes(prevChar)) &&
    nextChar !== SPACE
}

export const isRightFlanking = (prevChar: string, nextChar: string): boolean => {
  return (!punctuation.includes(prevChar) || `${punctuation} `.includes(nextChar)) &&
    prevChar !== SPACE
}

export const canOpen = (delim: DelimiterType, prevChar: string, nextChar: string): boolean => {
  return ['![', '[', '*'].includes(delim) || isLeftFlanking(prevChar, nextChar) && 
    (!isRightFlanking(prevChar, nextChar) || punctuation.includes(prevChar));
}

export const canClose = (delim: DelimiterType, prevChar: string, nextChar: string): boolean => {
  return delim === '*' || delim === '_' && isRightFlanking(prevChar, nextChar) &&
    (!isLeftFlanking(prevChar, nextChar) || punctuation.includes(nextChar));
}

export const startDelimiter = (cursor: Cursor): Delimiter | null => {
  if (!cursor.current) return null;

  let matchedDelim = DELIMITERS.find(delim => cursor.current.startsWith(delim));
  if (!matchedDelim) return null;

  const type = matchedDelim as DelimiterType;
  const prevChar = cursor.peek()[cursor.col - 1];
  let length = '_*'.includes(type)
    ? countRepeatingChar(cursor.current)
    : type.length;

  cursor.indent(length);
  const nextChar = cursor.current[0] ?? SPACE;

  return {
    type,
    length,
    canOpen: canOpen(type, prevChar, nextChar),
    canClose: canClose(type, prevChar, nextChar),
    active: true
  }
}

export const startCodeSpan = (cursor: Cursor): InlineCodeNode | null => {
  if (!cursor.current.startsWith('`')) return null;

  const length = countRepeatingChar(cursor.current);
  const target = '`'.repeat(length);
  let endLine = 0, endTickIdx: number;
  do {
    endTickIdx = cursor.peek(endLine).indexOf(target);
    endLine++;
  } while (endTickIdx === -1 && !cursor.eof(endLine));

  if (endTickIdx === -1) return null;

  const innerText = cursor.current.substring(0, endTickIdx).replaceAll('\n', SPACE);
  if (innerText.length === 0) return null;

  const text = !isEmptyLine(innerText) && innerText.at(-1) === SPACE && innerText.at(0) === SPACE
    ? innerText.slice(1, -1)
    : innerText

  return {
    type: 'InlineCode',
    text
  }
}

export class InlineParser {
  static parse(text: string): InlineNode[] {
    return [];
  }

  static processEmphasis(delimiters: Delimiter[]) {

  }
}
