import type { BlockParser } from '../Parser.ts';
import type { BlockCtx, ThematicBreakNode } from '../ast.ts';
import type { Cursor } from '../Cursor.ts';

const BREAK_REGEX = /^ {0,3}(?:(?:\*\s*){3,}|(?:\-\s*){3,}|(?:_\s*){3,})\s*$/;

export class ThematicBreakParser implements BlockParser<ThematicBreakNode> {
  public readonly interrupt = true;

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

