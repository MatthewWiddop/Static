import type { Block, BlockConstructor } from './blocks/Block.ts';
import type { Element } from './ast.ts';
import { tokenise } from './lexer.ts';

export interface Document extends Element {
  type: 'Document';
  children: Block[];
}

export class Parser {
  private children: Block[] = [];
  private _openBlock: Block | null = null;

  private get openBlock(): Block | null {
    return this._openBlock;
  }

  private set openBlock(block: Block) {
    this._openBlock = block;
    if (block !== null) {
      this.children.push(block)
    }
  }

  public parse(text: string): Document {
    const document: Document = {
      type: 'Document',
      children: this.children
    }
    const lines = text.split('\n');

    for (const line of lines) {
      this.parseLine(line);
    }

    return document;
  }

  private parseLine(line: string) {
    if (this.openBlock?.eat(line)) {
      return;
    }

    const newBlock = tokenise(line)!;
    this.openBlock = newBlock;
  }
}

export const markdownToHtml = (text: string): void => {
  const lines = text.split('\n');
  const parser = new Parser();
  // to return result in the future
}
