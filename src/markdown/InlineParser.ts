import type { ImageNode, InlineCodeNode, InlineNode, LinkNode, TextNode } from './ast.ts';
import { countRepeatingChar, isEmptyLine, isPaddedString } from '../utils.ts';
import { LineCursor, Point, type Cursor } from './Cursor.ts';
import { DelimiterNode } from './Delimiter.ts';

const SPACE = ' ';

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

  const start = cursor.pos;
  const end: Point = { row: start.row + endLine, col: endTickIdx };
  const innerText = cursor.slice(start, end).replaceAll('\n', SPACE);
  if (innerText.length === 0) return null;

  const text = !isEmptyLine(innerText) && isPaddedString(innerText)
    ? innerText.slice(1, -1)
    : innerText;

  cursor.continue(end.row - start.row);
  cursor.indent(end.col + length);

  return {
    type: 'InlineCode',
    text
  }
}

export const lookForImageOrLink = (
  cursor: Cursor,
  delimiters: Delimiter[]
): TextNode | LinkNode | ImageNode => {
  // find [ or ![
  // if not found, then return ] text node
  // if inactive, then return ] text node
  // else parse ahead for links, title
  // call processEmphasis on text section
  // set all [ markers to inactive before opening delimiter if link 
    // why do we keep inactive delimiters on the stack?
    //   not sure tbh
    // do we remove only this inactive delimiter, or all delimiters above this one?
    //   No, since they're all emphasis or strong emphasis
  
  const plainText: TextNode = {
    type: 'Text',
    text: ']'
  }

  const lastOpeningDelimiter = delimiters.findLast(delim => {
    return delim.type === '[' || delim.type == '![';
  });

  if (!lastOpeningDelimiter) return plainText;
  if (!lastOpeningDelimiter.active) {
    delimiters.pop(
    return plainText;
  }

  if (cursor.current.
}

export const processEmphasis = (
  delimiters: Delimiter[], 
  stackBottom: Delimiter | null = null
): void => {

}

export class InlineParser {
  static parse(text: string): InlineNode[] {
    const cursor = new LineCursor(text.split('\n'));
    const children: InlineNode[] = [];
    // TODO: implement delimiter stack

    while (!cursor.eof()) {
      const span = startCodeSpan(cursor);
      if (span) {
        children.push(span);
        continue;
      }

      const delim = DelimiterNode.start(cursor);
      if (delim) {
        children.push(delim.node);
        delimiters.push(delim);
        continue;
      }

      if (cursor.current.startsWith(']')) {
        const node = lookForImageOrLink(cursor, delimiters);
        children.push(node);
        continue;
      }
    }

    processEmphasis(delimiters);
    return children;
  }
}
