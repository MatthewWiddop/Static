import type { BlockCtx, BlockNode, BlockNodeType, ContainerNode, DocumentNode } from './ast.ts';
import { isContainerNode } from './ast.ts';
import { LineCursor, type Cursor } from './Cursor.ts';
import { DocumentParser, BlockQuoteParser, CodeBlockParser, HeadingParser, ListParser, ListItemParser, ParagraphParser, ThematicBreakParser } from './blocks/index.ts'
import { isEmptyLine, reverseRange } from '../utils.ts';
import { createFullOptions } from '../types/common.ts';

export interface BlockParser<T extends BlockNode = BlockNode> {
  interrupt?: boolean;
  start(cursor: Cursor): BlockCtx<T> | null;
  continue(cursor: Cursor, ctx: BlockCtx<T>): boolean;
  eat(cursor: Cursor, ctx: BlockCtx<T>): void;
}

const BLOCK_PARSERS: Record<BlockNodeType, BlockParser> = {
  'List': new ListParser(),
  'ListItem': new ListItemParser(),
  'Heading': new HeadingParser(),
  'CodeBlock': new CodeBlockParser(),
  'BlockQuote': new BlockQuoteParser(),
  'ThematicBreak': new ThematicBreakParser(),
  'Paragraph': new ParagraphParser(),
  'Document': new DocumentParser()
};

const getParser = (type: BlockNodeType): BlockParser => {
  return BLOCK_PARSERS[type];
}

const isContinuation = (newBlockType: BlockNodeType, lastOpenBlockType: BlockNodeType): boolean => {
  return newBlockType === 'Paragraph' && lastOpenBlockType === 'Paragraph'; 
}

interface closeSatiatedBlocksOptions {
  container: boolean;
}

const defaultFullBlocksOptions: closeSatiatedBlocksOptions = {
  container: true
}


export class Parser {
  static open: BlockCtx[] = [];

  static parse(text: string): DocumentNode {
    const cursor = new LineCursor(text.split('\n'));
    const root = getParser('Document').start(cursor) as BlockCtx<DocumentNode>;
    this.open = [root];
    let parser: BlockParser, last: BlockCtx;

    while (isEmptyLine(cursor.current)) {
      cursor.continue();
    }

    while (!cursor.eof) {
      console.log(cursor.current);
      const canConsume = this.open.map((blockCtx) => getParser(blockCtx.block.type).continue(cursor, blockCtx));
      console.log(cursor.current);
      console.log(canConsume);

      last = this.open.at(-1)!;
      const newBlockCtx = this.createBlock(cursor);
      this.open.splice(this.open.indexOf(last) + 1);
      if (newBlockCtx && !isContinuation(newBlockCtx.block.type, last.block.type)) {
        const parent = this.findLastOpenContainerBlock(canConsume);
        console.log(`parent: ${parent.block.type}`);
        this.closeSatiatedBlocks(canConsume, { container: true });

        parser = getParser(parent.block.type) 
        parser.eat(cursor, parent);
        reverseRange(this.open, this.open.indexOf(parent) + 1);
      } else if (isEmptyLine(cursor.current)) {
        this.closeSatiatedBlocks(canConsume);
      }

      last = this.open.at(-1)!;
      getParser(last.block.type).eat(cursor, last);
      console.log(this.open.map(blockCtx => blockCtx.block.type));
      console.log('---');

      cursor.continue();
    }

    this.open = [];
    return root.block;
  }

  static createBlock(cursor: Cursor): BlockCtx | null {
    for (const parser of Object.values(BLOCK_PARSERS)) {
      const block = parser.start(cursor);
      if (block) {
        return block;
      }
    }
    return null;
  }

  static closeSatiatedBlocks(
    canConsume: boolean[], 
    options: Partial<closeSatiatedBlocksOptions> = {}
  ): void {
    const fullOptions = createFullOptions(options, defaultFullBlocksOptions);
    this.open.splice(this.open.findLastIndex(({ block }, idx) => {
      return canConsume[idx] && (!fullOptions.container || isContainerNode(block));
    }) + 1);
  }

  static findLastOpenContainerBlock(
    canConsume: boolean[]
  ): BlockCtx<ContainerNode> {
    return this.open.findLast((blockCtx, idx) => {
      return canConsume[idx] && isContainerNode(blockCtx.block);
    }) as BlockCtx<ContainerNode>;
  }
}

