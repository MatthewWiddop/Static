import type { Cursor } from '../Cursor.ts';
import { Parser, type BlockParser } from '../Parser.ts';
import type { DocumentNode, BlockCtx } from '../ast.ts'

export class DocumentParser implements BlockParser<DocumentNode> {
  public start(cursor: Cursor): BlockCtx<DocumentNode> | null {
    if (!cursor.current) return null;
    return {
      block: {
        type: 'Document',
        children: []
      },
      ctx: {}
    }
  }

  public continue(_cursor: Cursor, _blockCtx: BlockCtx<DocumentNode>): boolean {
    return true;
  }

  public eat(cursor: Cursor, blockCtx: BlockCtx<DocumentNode>): void {
    cursor.col = 0;
    const newBlockCtx = Parser.createBlock(cursor);
    if (!newBlockCtx) return;
    blockCtx.block.children.push(newBlockCtx.block);
    Parser.open.push(newBlockCtx);
  }
}
