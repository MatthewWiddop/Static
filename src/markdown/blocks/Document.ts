import type { Cursor } from '../Cursor.ts';
import { Parser, type BlockParser } from '../Parser.ts';
import type { DocumentNode } from '../ast.ts'

export class DocumentParser implements BlockParser<DocumentNode> {
  public start(cursor: Cursor): DocumentNode | null {
    if (!cursor.current) return null;
    return {
      type: 'Document',
      indent: 0,
      children: []
    }
  }

  public continue(cursor: Cursor, block: DocumentNode): boolean {
    return true;
  }

  public eat(cursor: Cursor, block: DocumentNode): void {
    cursor.col = block.indent;
    const newBlock = Parser.createBlock(cursor);
    if (!newBlock) return;
    block.children.push(newBlock);
  }
}
