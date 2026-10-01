import type { ImageNode, InlineCodeNode, InlineNode, LinkNode, LinkTarget, TextNode } from './ast.ts';
import { countRepeatingChar, isEmptyLine, isEscapable, isPaddedString } from '../utils.ts';
import { LineCursor, Point, type Cursor } from './Cursor.ts';
import { DelimiterNode, DelimiterStack } from './Delimiter.ts';

const SPACE = ' ';

export const startCodeSpan = (cursor: Cursor): InlineCodeNode | null => {
  if (!cursor.current.startsWith('`')) return null;

  const length = countRepeatingChar(cursor.current);
  const end = cursor.findNext('`'.repeat(length));

  if (!end) return null;

  const start = cursor.pos;
  const innerText = cursor.slice(start, end).join(SPACE);
  if (innerText.length === 0) return null;

  const text = !isEmptyLine(innerText) && isPaddedString(innerText)
    ? innerText.slice(1, -1)
    : innerText;

  cursor.continue(end.row - start.row);
  cursor.indent(end.col + 1);

  return {
    type: 'InlineCode',
    text
  }
}

export const lookForImageOrLink = (
  cursor: Cursor,
  stack: DelimiterStack
): TextNode | LinkNode | ImageNode => {
  cursor.indent(1); 
  
  const plainText: TextNode = {
    type: 'Text',
    text: ']'
  }

  const openDelim = stack.findLast(delim => {
    return delim.type === '[' || delim.type == '![';
  });

  if (!openDelim) {
    return plainText;
  }

  // todo: clean up this function
  if (!openDelim.active) {
    stack.remove(openDelim);
    return plainText;
  }

  const target = parseLinkTarget(cursor);
  if (!target) {
    stack.remove(openDelim);
    return plainText;
  }
  // snatch nodes after opening delim and make them children
  // of the current node
  // call process emphasis on these node
  
  if (openDelim.type === '![') {
    return {
      type: 'Image', // todo: continue exit
    };
  }

  stack.findLast((node) => {
    if (node.type === '[') {
      if (!node.active) return true;

      node.active = false;
    }

    return false;
  });

  return {
    type: 'Link',
  };
}

export type ParsedTargetDest = {
  dest: string;
  length: number; // todo: update to return end point instead
}

export const parseClosedTargetDest = (text: string): ParsedTargetDest | null => {
  let dest = '';
  let escaped = false;
  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    if (char === '>' && !escaped) {
      return {
        dest: dest,
        length: i + 1
      };
    }
    if (char === '\\') {
      if (escaped) {
        dest += '\\';
      }
      escaped = !escaped;
    }
    else {
      dest += char;
      escaped = false;
    }
  }

  return null;
}

export const parseOpenTargetDest = (text: string): ParsedTargetDest | null => {
  let dest = '';
  let escaped = false;
  let openingParenthesis = 0;
  let i = 0;
  for (; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      if (!isEscapable(char)) {
        dest += '\\';
      }
      dest += char;
    }
    else if (char === '(') {
      openingParenthesis++;
      dest += char;
    }
    else if (char === ')') {
      if (openingParenthesis === 0) {
        return {
          dest,
          length: i
        };
      }
      dest += char;
      openingParenthesis--;
    }
    else if (char === '\\') {
      escaped = true;
    }
    else if (char === ' ') {
      break;
    }
    else {
      dest += char;
    }
  }

  if (openingParenthesis > 0) {
    return null;
  }

  return {
    dest,
    length: i
  };
}

const parseTargetDest = (text: string): ParsedTargetDest | null => {
  const emptyTarget: ParsedTargetDest = {
    dest: '',
    length: 0
  };

  if (text.startsWith(')')) return emptyTarget;

  return text.startsWith('<')
    ? parseClosedTargetDest(text)
    : parseOpenTargetDest(text);
}

export type ParsedTargetTitle = {
  title: string;
  end: Point;
}

export const parseTargetTitle = (cursor: Cursor, start: Point): ParsedTargetTitle | null => {
  let title = '';
  let escaped = false;
  
  const titleOpenings: string[] = ['\'', '"', '('];
  const titleLines = cursor.slice(start);
  if (!titleLines) return null;

  const openingChar = titleOpenings.find(char => titleLines[0].startsWith(char));
  if (!openingChar) return null;

  const closingChar = openingChar === '(' ? ')' : openingChar;
  for (let row = 0; row < titleLines.length; row++) {
    const line = titleLines[row];
    for (let col = !row ? start.col : 0; col < line.length; col++) {
      const char = line[col];
      if (escaped) {
        escaped = false;
        if (!isEscapable(char)) {
          title += '\\';
        }
        title += char;
      }
      else if (char === '\\') {
        escaped = true;
      }
      else if (char === closingChar) {
        return {
          title,
          end: {
            row: start.row + row,
            col: (!row ? start.col : 0) + col
          }
        };
      }
      else {
        title += char;
      }
    }
  }

  return null;
}

export const parseLinkTarget = (cursor: Cursor): LinkTarget | null => {
  if (!cursor.current.startsWith('(')) return null;

  const destLineOffset = isEmptyLine(cursor.current.slice(1)) ? 1 : 0;
  const destLine = (destLineOffset 
    ? cursor.peek(destLineOffset) 
    : cursor.current.slice(1))
    .trimStart();

  if (isEmptyLine(destLine)) return null;

  const result: LinkTarget = {
    destination: '',
    title: ''
  };

  const dest = parseTargetDest(destLine);  
  if (!dest) return null;

  const titleLineOffset = destLineOffset + (isEmptyLine(destLine.slice(dest.length)) ? 1 : 0);
  const titleLine = (titleLineOffset === 2
    ? cursor.peek(titleLineOffset)
    : destLine.slice(dest.length))
    .trimStart();

  const titleStart: Point = {
    row: cursor.pos.row + titleLineOffset,
    col: (destLineOffset ? cursor.pos.col : 0) + dest.length
  };

  const title = parseTargetTitle(cursor, titleStart);
  if (!title) return null;

  const rowOffset = title.end.row - cursor.pos.row;
  const remainingLine = cursor.peek(rowOffset).slice(title.end.col);
  const isRemainingEmpty = isEmptyLine(remainingLine);
  const isClosed = (isRemainingEmpty
    ? cursor.peek(rowOffset + 1)
    : remainingLine)
    .trimStart()
    .startsWith(')');

  if (!isClosed) return null;

  cursor.continue(rowOffset + (isRemainingEmpty ? 1 : 0));
  cursor.indent(!isRemainingEmpty ? title.end.col + 1 : 1);

  return {
    destination: dest.dest,
    title: title.title
  }
}

export const processEmphasis = (
  stack: DelimiterStack,
  bottom: DelimiterNode | null = null
): void => {

}

export class InlineParser {
  static parse(text: string): InlineNode[] {
    const cursor = new LineCursor(text.split('\n'));
    const stack = new DelimiterStack();
    const children: InlineNode[] = [];

    while (!cursor.eof()) {
      const span = startCodeSpan(cursor);
      if (span) {
        children.push(span);
        continue;
      }

      const delim = DelimiterNode.start(cursor);
      if (delim) {
        stack.push(delim);
        children.push(delim.text);
        continue;
      }

      if (cursor.current.startsWith(']')) {
        const node = lookForImageOrLink(cursor, stack);
        children.push(node);
        continue;
      }
    }

    processEmphasis(stack);
    return children;
  }
}
