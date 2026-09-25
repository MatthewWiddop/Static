import { type BlockParser } from '../Parser.ts';
import type { ParagraphNode, BlockCtx } from '../ast.ts';
import { isEmptyLine } from '../../utils.ts';
import type { Cursor } from '../Cursor.ts';

export class ParagraphParser implements BlockParser<ParagraphNode> {
  public start(cursor: Cursor): BlockCtx<ParagraphNode> | null {
    if (isEmptyLine(cursor.current)) return null;
    return {
      block: {
        type: 'Paragraph',
        children: []
      },
      ctx: {
        text: ''
      }
    };
  }

  public continue(cursor: Cursor, _blockCtx: BlockCtx<ParagraphNode>): boolean {
    return !isEmptyLine(cursor.current);
  }

  public eat(cursor: Cursor, { ctx }: BlockCtx<ParagraphNode>): void {
    if (!cursor.current) return;
    const newLine = cursor.current.trim();
    ctx.text += ctx.text ? '\n' + newLine : newLine;
    cursor.indent();
  }
}

