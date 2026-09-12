import type { Block } from './Block.ts';
import { calcBlockIndent, countLeftSpaces, isEmptyLine } from '../../utils.ts';
import { tokenise } from '../lexer.ts';

export class BlockQuote implements Block<'BlockQuote'> {
  public readonly type = 'BlockQuote';
  static readonly startRe = /^ {0,3}>/;
  static readonly interrupt = true;
  public children: Block[] = [];
  private _openBlock: Block | null = null;

  static start(line: string): BlockQuote | null {
    if (!this.startRe.test(line)) {
      return null;
    }
    
    return new BlockQuote(line);
  }

  public eat(line: string): boolean {
    if (isEmptyLine(line)) {
      return false;
    }

    const hasMarker = BlockQuote.startRe.test(line);

    const lineContent = hasMarker
      ? line.slice(this.calcItemCol(line))
      : line;

    if (isEmptyLine(lineContent)) {
      this.openBlock = null;
      return true;
    }

    if (this.openBlock?.type === 'Paragraph') {
      const interruptingBlock = tokenise(lineContent, { inParagraph: true });

      if (!interruptingBlock) {
        this.openBlock.eat(lineContent);
        return true;
      }

      if (hasMarker) {
        this.openBlock = interruptingBlock;
        return true;
      }
      return false;
    }

    if (!hasMarker) {
      return false;
    }

    if (this.openBlock?.eat(lineContent)) {
      return true;
    }

    this.openBlock = tokenise(lineContent);
    return !this.openBlock;
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

  private calcItemCol(line: string): number {
    const leadingSpaces = line.indexOf('>');
    if (leadingSpaces === -1) return 0;
    const spaces = countLeftSpaces(
      line.slice(leadingSpaces + 1)
    );
    const trailingSpaces = !spaces ? spaces : calcBlockIndent(spaces);
    return leadingSpaces + '>'.length + trailingSpaces;
  }

  constructor(line: string) {
    const itemCol = this.calcItemCol(line);
    this.openBlock = tokenise(line.slice(itemCol));
  }
}

