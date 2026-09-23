import type { FenceType, CodeBlockNode, BlockCtx, FencedCodeBlockCtx } from '../ast.ts';
import { isFencedCodeBlockNode } from '../ast.ts';
import type { BlockParser } from '../Parser.ts'
import type { Cursor } from '../Cursor.ts';
import { isEmptyLine, trimIndentation } from '../../utils.ts';

const FENCE_START = /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
const FENCE_END = /^ {0,3}(`+|~+)\s*/;
const SPACE = ' ';

const detectFencedCodeStart = (cursor: Cursor): BlockCtx<CodeBlockNode> | null => {
  const match = cursor.current?.match(FENCE_START);
  if (!match) return null;

  const [, spaces, fence, language] = match;
  const indent = cursor.col;
  cursor.indent();
  return {
    block: {
      type: 'CodeBlock',
      language: language || undefined,
      text: ''
    },
    ctx: {
      fenced: true,
      fenceType: fence as FenceType,
      fenceCount: fence.length,
      fenceIndent: spaces.length,
      indent
    }
  };
}

const detectIndentedCodeStart = (cursor: Cursor): BlockCtx<CodeBlockNode> | null => {
  if (!cursor.current.startsWith(SPACE.repeat(4)) || isEmptyLine(cursor.current)) return null;

  return {
    block: {
      type: 'CodeBlock',
      text: ''
    },
    ctx: {
      fenced: false,
      indent: cursor.col,
    }
  };
}

const detectFencedCodeEnd = (cursor: Cursor, ctx: FencedCodeBlockCtx): boolean => {
  const match = cursor.current.match(FENCE_END);
  if (!match) return false;

  const [, fence] = match;
  if (fence[0] !== ctx.fenceType || fence.length < ctx.fenceCount) return false;

  return true;
}

const detectIndentedCodeEnd = (cursor: Cursor): boolean => {
  const line = cursor.current;
  if (isEmptyLine(line)) return false;

  return !line.startsWith(SPACE.repeat(4));
}

export class CodeBlockParser implements BlockParser<CodeBlockNode> {
  public interrupt = true;

  public start(cursor: Cursor): BlockCtx<CodeBlockNode> | null {
    return detectFencedCodeStart(cursor) ?? detectIndentedCodeStart(cursor);
  }

  public continue(cursor: Cursor, { block, ctx }: BlockCtx<CodeBlockNode>): boolean {
    const line = cursor.current;
    if (cursor.col < ctx.indent && !isEmptyLine(line)) return false;

    const endBlock = isFencedCodeBlockNode(ctx)
      ? detectFencedCodeEnd(cursor, ctx)
      : detectIndentedCodeEnd(cursor);

    if (endBlock) {
      cursor.indent();
      return false;
    }

    return true;
  }

  public eat(cursor: Cursor, { block, ctx }: BlockCtx<CodeBlockNode>): void {
    const newLine = trimIndentation(cursor.current, ctx.indent);
    block.text += block.text ? '\n' + newLine : newLine;
    cursor.indent();
  }
}

