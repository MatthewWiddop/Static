import type { Block, BlockConstructor } from './Block.ts';

export class ThematicBreak implements Block<'ThematicBreak'> {
  public readonly type = 'ThematicBreak';
  static readonly interrupt = true;
  static start(line: string): ThematicBreak | null {
    const startRe = /^ {0,3}(?:(?:\*\s*){3,}|(?:\-\s*){3,}|(?:_\s*){3,})\s*$/;
    if (!startRe.test(line)) {
      return null;
    }
    return new ThematicBreak();
  }

  public eat(line: string): boolean {
    return false;
  }
}
