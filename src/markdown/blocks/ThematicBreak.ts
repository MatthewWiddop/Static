import type { BlockParser } from '../Parser.ts';
import type { ThematicBreakNode } from '../ast.ts';
import type { Cursor } from '../Cursor.ts';

const BREAK_REGEX = /^ {0,3}(?:(?:\*\s*){3,}|(?:\-\s*){3,}|(?:_\s*){3,})\s*$/;

export class ThematicBreakParser implements BlockParser<ThematicBreakNode> {
  public readonly interrupt = true;

  public start(cursor: Cursor): ThematicBreakNode | null {
    if (!cursor.current || !BREAK_REGEX.test(cursor.current)) {
      return null;
    }
    return {
      type: 'ThematicBreak'
    }
  }

  public continue(cursor: Cursor, block: ThematicBreakNode): boolean {
    return false;
  }

  public eat(cursor: Cursor, block: ThematicBreakNode): void { }
}
