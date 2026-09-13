import type { Block } from './Block.ts';
import { SourceLine, type Source } from '../SourceLine.ts';
import { tokenise } from '../lexer.ts';

interface ListItemInfo {
  line: Source;
}

export class ListItem implements Block<'ListItem'> {
  public readonly type = 'ListItem';
  public children: Block[] = [];
  public offset: number;
  private _openBlock: Block | null = null;

  public eat(line: Source): boolean {
    if (this.offset <= line.offset) {
      const newLine = new SourceLine(line.raw, this.offset);
      if (this.openBlock?.eat(newLine)) return true;

      this.openBlock = tokenise(newLine);
      return this.openBlock !== null;
    }

    if (this.openBlock?.eat(line)) return true;
    return false;
  }

  private get openBlock(): Block | null {
    return this._openBlock;
  }

  private set openBlock(block: Block | null) {
    this._openBlock = block;
    if (block !== null) {
      this.children.push(block);
    }
  }

  constructor(info: ListItemInfo) {
    this.offset = info.line.offset;
    this.eat(info.line);
  }
}

