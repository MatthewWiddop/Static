import type { ImageNode, InlineCodeNode, InlineNode, LinkNode, LinkTarget, TextNode } from './ast.ts';
import { countLeadingSpaces, countRepeatingChar, isEmptyLine, isPaddedString } from '../utils.ts';
import { LineCursor, Point, type Cursor } from './Cursor.ts';
import { DelimiterNode, DelimiterStack } from './Delimiter.ts';

const SPACE = ' ';

export const startCodeSpan = (cursor: Cursor): InlineCodeNode | null => {
  if (!cursor.current.startsWith('`')) return null;

  const length = countRepeatingChar(cursor.current);
  const end = cursor.findNext('`'.repeat(length));

  if (!end) return null;

  const start = cursor.pos;
  const innerText = cursor.slice(start, end).replaceAll('\n', SPACE);
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

export type ParsedLinkDestination = {
  destination: string;
  length: number;
}

export const parseClosedTargetDestination = (text: string): ParsedLinkDestination | null => {
  let dest = '';
  let escaped = false;
  for (let i = 1; i < text.length; i++) {
    const char = text[i];
    if (char === '>' && !escaped) {
      return {
        destination: dest,
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

export const parseOpenTargetDestination = (text: string): ParsedLinkDestination | null => {
  let dest = '';
  let escaped = false;
  let openingParenthesis = 0;
  const escapableChars = ['\\', '(', ')'];
  let i;
  for (i = 0; i < text.length; i++) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      if (!escapableChars.includes(char)) {
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
          destination: dest,
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
    destination: dest,
    length: i
  };
}

export const parseLinkTarget = (cursor: Cursor): LinkTarget | null => {
  if (!cursor.current.startsWith('(')) {
    return null;
  }

  const result: LinkTarget = {
    destination: '',
    title: ''
  };

  let destCol = countLeadingSpaces(cursor.current.slice(1)) + 1;
  if (cursor.current[destCol] === ')') {
    return result;
  }
  
  const target = cursor.current[destCol] === '<'
    ? parseClosedTargetDestination(cursor.current.slice(destCol))
    : parseOpenTargetDestination(cursor.current.slice(destCol));

  if (!target) {
    return null;
  }

  // find indentation of title
  // parse the title
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
