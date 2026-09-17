import type { FencedCodeBlockNode, FenceType, CodeBlockNode } from '../ast.ts';
import { isFencedCodeBlockNode } from '../ast.ts';
import type { BlockParser } from '../Parser.ts'
import type { Cursor } from '../Cursor.ts';
import { isEmptyLine, trimIndentation } from '../../utils.ts';

const FENCE_START = /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
const FENCE_END = /^ {0,3}(`+|~+)\s*/;
const SPACE = ' ';

const detectFencedCodeStart = (cursor: Cursor): FencedCodeBlockNode | null => {
  const match = cursor.current?.match(FENCE_START);
  if (!match) return null;

  const [, spaces, fence, language] = match;
  const indent = cursor.col;
  cursor.indent();
  return {
    type: 'CodeBlock',
    fenced: true,
    fenceType: fence as FenceType,
    fenceCount: fence.length,
    fenceIndent: spaces.length,
    indent,
    text: ''
  };
}

const detectIndentedCodeStart = (cursor: Cursor): CodeBlockNode | null => {
  if (!cursor.current.startsWith(SPACE.repeat(4)) || isEmptyLine(cursor.current)) return null;

  return {
    type: 'CodeBlock',
    fenced: false,
    indent: cursor.col,
    text: ''
  };
}

const detectFencedCodeEnd = (cursor: Cursor, block: FencedCodeBlockNode): boolean => {
  const match = cursor.current.match(FENCE_END);
  if (!match) return false;

  const [, fence] = match;
  if (fence[0] !== block.fenceType || fence.length < block.fenceCount) return false;

  return true;
}

const detectIndentedCodeEnd = (cursor: Cursor): boolean => {
  const line = cursor.current;
  if (isEmptyLine(line)) return false;

  return !line.startsWith(SPACE.repeat(4));
}

export class CodeBlockParser implements BlockParser<CodeBlockNode> {
  public interrupt = true;

  public start(cursor: Cursor): CodeBlockNode | null {
    const codeBlock = detectFencedCodeStart(cursor) ?? detectIndentedCodeStart(cursor);
    if (!codeBlock) return null;
    
    return codeBlock;
  }

  public continue(cursor: Cursor, block: CodeBlockNode): boolean {
    const line = cursor.current;
    if (cursor.col < block.indent && !isEmptyLine(line)) return false;

    const endBlock = isFencedCodeBlockNode(block)
      ? detectFencedCodeEnd(cursor, block)
      : detectIndentedCodeEnd(cursor);

    if (endBlock) {
      cursor.indent();
      return false;
    }

    return true;
  }

  public eat(cursor: Cursor, block: CodeBlockNode): void {
    const newLine = trimIndentation(cursor.current, block.indent)
    block.text += block.text ? '\n' + newLine : newLine
    cursor.indent()
  }
}

