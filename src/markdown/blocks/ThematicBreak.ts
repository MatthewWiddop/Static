import type { Source } from '../SourceLine.ts';
import type { Block } from './Block.ts';

const BREAK_REGEX = /^ {0,3}(?:(?:\*\s*){3,}|(?:\-\s*){3,}|(?:_\s*){3,})\s*$/;

export class ThematicBreak implements Block<'ThematicBreak'> {
  public readonly type = 'ThematicBreak';
  static readonly interrupt = true;
  static start(line: Source): ThematicBreak | null {
    if (!BREAK_REGEX.test(line.content)) {
      return null;
    }
    return new ThematicBreak();
  }

  public eat(line: Source): boolean {
    return false;
  }
}
