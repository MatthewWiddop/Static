import type { EmphasisNode, ImageNode, InlineCodeNode, InlineNode, LinkNode, LinkTarget, TextNode } from './ast';
import { countRepeatingChar, isEmptyLine, isEscapable, isPaddedString } from '../utils';
import { LineCursor, type Point, type Cursor } from './Cursor';
import { DelimiterNode, DelimiterStack, initOpenersBottom } from './Delimiter';

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
  stack: DelimiterStack,
  nodes: InlineNode[]
): TextNode | LinkNode | ImageNode => {
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

  const children = nodes.splice(nodes.indexOf(openDelim.text) + 1);
  processEmphasis(children, stack, openDelim);
  stack.remove(openDelim);
  
  if (openDelim.type === '![') {
    return {
      type: 'Image',
      description: children,
      destination: target.destination,
      title: target.title
    };
  }

  stack.walkBackUntil((node) => {
    if (node.type === '[') {
      if (!node.active) return true;

      node.active = false;
    }

    return false;
  });

  return {
    type: 'Link',
    text: children,
    destination: target.destination,
    title: target.title
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

  const dest = parseTargetDest(destLine);  
  if (!dest) return null;

  const titleLineOffset = destLineOffset + (isEmptyLine(destLine.slice(dest.length)) ? 1 : 0);

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

export const getEmphasisNode = (
  nodes: InlineNode[],
  opener: DelimiterNode,
  closer: DelimiterNode
): EmphasisNode => {
  const isStrong = Math.min(opener.length, closer.length) >= 2;
  const openerIdx = nodes.indexOf(opener.text);
  const closerIdx = nodes.indexOf(closer.text);
  console.log(nodes);
  console.log(openerIdx, closerIdx);
  const emph: EmphasisNode = {
    type: 'Emphasis',
    strong: isStrong,
    children: nodes.splice(openerIdx + 1, closerIdx - openerIdx - 1)
  };

  return emph;
}

export const processEmphasis = (
  nodes: InlineNode[],
  stack: DelimiterStack,
  bottom: DelimiterNode | null = null
): void => {
  const openerBottoms = initOpenersBottom(bottom);
  let current = stack.find(node => node.canClose, bottom); 
  while (current !== null) {
    console.log('---');
    const currentNode = current;
    console.log(currentNode);
    const openerBottom = openerBottoms.get(current);

    const opener = stack.findLast(
      node => node.canOpen && node.type === currentNode.type, 
      openerBottom,
      currentNode
    );
    console.log('opener is');
    console.log(opener);

    if (opener) {
      const emph = getEmphasisNode(nodes, opener, currentNode);
      console.log(emph);
      nodes.splice(nodes.indexOf(current.text), 0, emph);
      
      while (opener.next !== currentNode && opener.next !== null) {
        stack.remove(opener.next);
      }

      const emphLength = emph.strong ? 2 : 1;
      opener.length -= emphLength;
      current.length -= emphLength;

      if (opener.length === 0) {
        const openerIdx = nodes.indexOf(opener.text);
        stack.remove(opener);
        nodes.splice(openerIdx, 1);
      }

      if (current.length === 0) {
        const closerIdx = nodes.indexOf(currentNode.text);
        stack.remove(current);
        nodes.splice(closerIdx, 1);
        current = current.next;
      }
      return;
    }
    else {
      openerBottoms.set(currentNode, currentNode.prev);
      if (!currentNode.canOpen) {
        stack.remove(currentNode);
        current = current.next;
      }
      current = currentNode.next; // todo: check if (and why) this line is necessary
    }

    current = stack.find(node => node.canClose, current?.prev);
  }

  while (stack.peek() !== bottom) {
    stack.pop();
  }
}

export const startHardLineBreak = (cursor: Cursor): boolean => {
  if (isEmptyLine(cursor.peek(1))) return false;

  if (!cursor.current.startsWith('  ') && !cursor.current.startsWith('\\')) {
    return false;
  }

  cursor.continue();
  return true;
}

export const appendText = (text: string, nodes: InlineNode[]): void => {
  const last = nodes.at(-1);
  if (last?.type !== 'Text' || !canContinueTextNode(last)) {
    nodes.push({
      type: 'Text',
      text: text
    });
  }
  else {
    last.text += text;
  }
}

export const canContinueTextNode = (node: TextNode) => {
  return !DelimiterNode.delimiters.includes(node.text);
}

export class InlineParser {
  static parse(text: string): InlineNode[] {
    const cursor = new LineCursor(text.split('\n'));
    const stack = new DelimiterStack();
    const nodes: InlineNode[] = [];
    let escaped = false;
    console.log(`text: ${text}`);

    while (!cursor.eof()) {
      if (cursor.eol()) {
        cursor.continue();
        continue;
      }

      if (escaped) {
        escaped = false;
        const char = cursor.current[0];
        const text = isEscapable(char) ? char : `\\${char}`;
        if (startHardLineBreak(cursor)) {
          nodes.push({
            type: 'HardBreak'
          });
        }
        else {
          appendText(text, nodes);
          cursor.indent(1);
        }
        continue;
      }

      if (cursor.current.startsWith('\\')) {
        escaped = true;
        cursor.indent(1);
        continue;
      }

      const span = startCodeSpan(cursor);
      if (span) {
        nodes.push(span);
        continue;
      }

      const delim = DelimiterNode.start(cursor);
      if (delim) {
        nodes.push(delim.text);
        stack.push(delim);
        continue;
      }

      if (cursor.current.startsWith(']')) {
        cursor.indent(1);
        const node = lookForImageOrLink(cursor, stack, nodes);
        nodes.push(node);
        continue;
      }

      if (startHardLineBreak(cursor)) {
        nodes.push({
          type: 'HardBreak'
        });
        continue;
      }

      appendText(cursor.current[0], nodes);
      cursor.indent(1);
    }

    processEmphasis(nodes, stack);
    console.log(nodes);
    return nodes;
  }
}

