import type { Block, BlockConstructor } from './blocks/Block';
import type { Element } from './ast';

export interface Document extends Element {
  type: 'Document';
  children: Block[];
}

export class Parser {
  private blocks: Block[] = [];
  private open: Block | null = null;
  private blockTypes: BlockConstructor[] = [
    
  ];

  public parse(text: string): Document {
    const document: Document = {
      type: 'Document',
      children: this.blocks
    }
    const lines = text.split('\n');

    for (const line of lines) {
      this.parseLine(line);
    }

    return document;
  }

  private parseLine(line: string) {
    // try parsers against the line
    // make new blocks as necessary
    // don't parse inlines yet, save that until the end
  }

  private startNewBlocks(line) {

  }

  private addRemainingText(line) {
    
  }
}

export const markdownToHtml = (text: string): string => {
  const lines = text.split('\n');

  return stringify(root);
}

const stringify = (root: Document): string => {
  return '';
}
