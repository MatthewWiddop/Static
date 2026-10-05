import type { BlockParser } from '../Parser';
import type { BlockCtx, ThematicBreakNode } from '../ast';
import type { Cursor } from '../Cursor';

const BREAK_REGEX = /^ {0,3}(?:(?:\*\s*){3,}|(?:\-\s*){3,}|(?:_\s*){3,})\s*$/;

export class ThematicBreakParser implements BlockParser<ThematicBreakNode> {
  public start(cursor: Cursor): BlockCtx<ThematicBreakNode> | null {
    if (!cursor.current || !BREAK_REGEX.test(cursor.current)) {
      return null;
    }

    cursor.indent();
    return {
      block: {
        type: 'ThematicBreak'
      },
      ctx: {}
    }
  }

  public continue(_cursor: Cursor, _blockCtx: BlockCtx<ThematicBreakNode>): boolean {
    return false;
  }

  public eat(_cursor: Cursor, _block: BlockCtx<ThematicBreakNode>): void { }
}

