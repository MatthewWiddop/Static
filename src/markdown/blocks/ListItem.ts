import type { Block } from './Block.ts';
import { tokenise } from '../lexer.ts';
import { calcBlockIndent, countLeftSpaces, isEmptyLine } from '../../utils.ts';

export type BulletListMarker = '-' | '+' | '*';
export type OrderedListMarker = '.' | ')';
export type ListMarker = BulletListMarker | OrderedListMarker;

export class ListItem implements Block<'ListItem'> {
  public readonly type = 'ListItem';
  public children: Block[] = [];
  private _openBlock: Block | null = null;
  private indentation: number;
  private markerCol: number;

  public eat(line: string): boolean {
    if (isEmptyLine(line)) { // handle lazy continuation, cannot necessarily close block on a blank line. Close the outer most block?
      this.openBlock = null;
      return true;
    }

    if (line.length > 

    if (this.openBlock?.type === 'Paragraph') {
      const interruptingBlock = tokenise(line.split

    const newBlock = tokenise(line.slice(this.contentCol));
    if (newBlock?.type === 'ThematicBreak') {
      return false;
    }
    this.openBlock = newBlock;
    return this.openBlock !== null;
  }

  private closeBlock(): void {
    if (!this.openBlock) return;
    this.children.push(this.openBlock);
    this.openBlock = null;
  }

  private calcIndentation(line: string): number {
    return calcBlockIndent(spaces) + this.markerCol;
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

  private get contentCol(): number {
    return this.indentation + this.markerCol;
  }

  constructor(line: string, markerCol: number) {
    this.markerCol = markerCol;
    this.indentation = this.calcIndentation(line);
    this.eat(line); // TODO: finish eat func
  }
}
