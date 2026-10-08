import type { EmphasisNode, ImageNode, InlineCodeNode, InlineNode, LinkNode, LinkTarget, TextNode } from './ast';
import { countRepeatingChar, isEmptyLine, isEscapable, isPaddedString } from '../utils';
import { LineCursor, type Point, type Cursor } from './Cursor';
import { DelimiterNode, DelimiterStack, initOpenersBottom, consumeDelimiter, isEmphasisDelimiterNode } from './Delimiter';

const SPACE = ' ';

export const consumeCodeSpan = (cursor: Cursor, nodes: InlineNode[]): boolean => {
  if (!cursor.current.startsWith('`')) return false;

  const length = countRepeatingChar(cursor.current);
  const end = cursor.findNext('`'.repeat(length));

  if (!end) return false;

  const start = cursor.pos;
  const innerText = cursor.slice(start, end).join(SPACE);
  if (innerText.length === 0) return false;

  const text = !isEmptyLine(innerText) && isPaddedString(innerText)
    ? innerText.slice(1, -1)
    : innerText;

  cursor.continue(end.row - start.row);
  cursor.indent(end.col + 1);

  nodes.push({
    type: 'InlineCode',
    text
  });
  return true;
}

export const findLastOpenDelimiter = (stack: DelimiterStack): DelimiterNode | null => {
  return stack.findLast(delim => !isEmphasisDelimiterNode(delim));
}

export const deactivateLinkOrImageDelimiters = (stack: DelimiterStack): void =>
  stack.walkBackUntil((node) => {
    if (node.type === '[') {
      if (!node.active) return true;

      node.active = false;
    }

    return false;
  });
}

export const consumeLinkOrImage = (
  cursor: Cursor,
  nodes: InlineNode[],
  stack: DelimiterStack,
): boolean => {
  if (!cursor.current.startsWith(']')) return false;
  const plainText: TextNode = {
    type: 'Text',
    text: ']'
  }

  const openDelim = findLastOpenDelimiter(stack);
  if (!openDelim) {
    nodes.push(plainText);
    return true;
  }

  if (!openDelim.active) {
    nodes.push(plainText);
    stack.remove(openDelim);
    return true;
  }

  const target = parseLinkTarget(cursor);
  if (!target) {
    nodes.push(plainText);
    stack.remove(openDelim);
    return true;
  }

  const children = nodes.splice(nodes.indexOf(openDelim.text) + 1);
  processEmphasis(children, stack, openDelim);
  stack.remove(openDelim);
  
  if (openDelim.type === '![') {
    nodes.push({
      type: 'Image',
      description: children,
      destination: target.destination,
      title: target.title
    });
  }
  else {
    deactivateLinkOrImageDelimiters(stack);

    nodes.push({
      type: 'Link',
      text: children,
      destination: target.destination,
      title: target.title
    });
  }
  return true;
}

export type ParsedTargetDest = {
  dest: string;
  length: number;
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
  };
}

export const getEmphasisNode = (
  nodes: InlineNode[],
  opener: DelimiterNode,
  closer: DelimiterNode
): EmphasisNode => {
  const isStrong = Math.min(opener.length, closer.length) >= 2;
  const openerIdx = nodes.indexOf(opener.text);
  const closerIdx = nodes.indexOf(closer.text);
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
    const currentNode = current;
    const openerBottom = openerBottoms.get(current);

    const opener = stack.findLast(
      node => node.canOpen && node.type === currentNode.type, 
      openerBottom,
      currentNode
    );

    if (opener) {
      const emph = getEmphasisNode(nodes, opener, currentNode);
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
      }
      current = currentNode.next;
    }

    current = stack.find(node => node.canClose, current?.prev);
  }

  while (stack.peek() !== bottom) {
    stack.pop();
  }
}

export const consumeHardBreak = (cursor: Cursor, nodes: InlineNode[]): boolean => {
  if (isEmptyLine(cursor.peek(1))) return false;

  if (!cursor.current.startsWith('  ') && 
      !cursor.current.startsWith('\\') && 
      !cursor.eol(1)
  ) {
    return false;
  }

  cursor.continue();
  nodes.push({
    type: 'HardBreak'
  });

  return true;
}

export const consumeText = (cursor: Cursor, nodes: InlineNode[]): boolean => {
  const text = cursor.current[0];
  appendText(text, nodes);
  return true;
}

export const appendText = (text: string, nodes: InlineNode[]): void => {
  const last = nodes.at(-1);
  if (!last || last.type !== 'Text' || !canContinueTextNode(last)) {
    nodes.push({
      type: 'Text',
      text: text
    });
  }
  else {
    last.text += text;
  }
}

export const canContinueTextNode = (node: TextNode): boolean => {
  return !DelimiterNode.delimiters.includes(node.text);
}

export const initConsumeEscape = (): (cursor: Cursor, nodes: InlineNode[]) => boolean => {
  let escaped = false;

  return (cursor: Cursor, nodes: InlineNode[]): boolean => {
    if (!cursor.current) return false;
    if (!escaped) {
      if (!cursor.current.startsWith('\\') || cursor.eol(1)) return false;
    }
    else {
      const char = cursor.current[0];
      const text = isEscapable(char) ? char : `\\${char}`;
      appendText(text, nodes);
    }

    escaped = !escaped;
    cursor.indent(1);
    return true;
  }
}

export class InlineParser {
  static parse(text: string): InlineNode[] {
    const cursor = new LineCursor(text.split('\n'));
    const stack = new DelimiterStack();
    const nodes: InlineNode[] = [];
    const consumeEscape = initConsumeEscape();

    while (!cursor.eof()) {
      if (consumeEscape(cursor, nodes)) continue;
      if (consumeCodeSpan(cursor, nodes)) continue;
      if (consumeDelimiter(cursor, nodes, stack)) continue;
      if (consumeLinkOrImage(cursor, nodes, stack)) continue;
      if (consumeHardBreak(cursor, nodes)) continue;

      consumeText(cursor, nodes);
    }

    processEmphasis(nodes, stack);
    return nodes;
  }
}

