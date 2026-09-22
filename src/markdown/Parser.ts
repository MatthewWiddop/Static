import type { BlockCtx, BlockNode, BlockNodeType, BlockCtx, ContainerNode, DocumentNode } from './ast.ts';
import { isContainerNode } from './ast.ts';
import { LineCursor, type Cursor } from './Cursor.ts';
import { DocumentParser, BlockQuoteParser, CodeBlockParser, HeadingParser, ListParser, ListItemParser, ParagraphParser, ThematicBreakParser } from './blocks/index.ts'
import { isEmptyLine } from '../utils.ts';
import { createFullOptions } from '../types/common.ts';

// TODO:
// add corresponding context for certain block types and have the open block be an array of node, context pairs
// - context should be optional, since certain blocks don't use it
// - function should check that a function has a context and return the correct one e.g. text container indent
// - open blocks that are being closed should be parsed and the inline array added to the ast
// update closeSatiatedBlocks to call the inline parser with the text property of the node

export interface BlockParser<T extends BlockNode = BlockNode> {
  interrupt?: boolean;
  start(cursor: Cursor): BlockCtx<T> | null;
  continue(cursor: Cursor, ctx: BlockCtx<T>): boolean;
  eat(cursor: Cursor, ctx: BlockCtx<T>, open: BlockCtx[]): void;
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
      let canConsume = this.open.map(({ block }) => getParser(block.type).continue(cursor, block));

      const newBlockCtx = this.createBlock(cursor);
      last = this.open.at(-1)!;
      if (newBlockCtx && !isContinuation(newBlockCtx.block.type, last.block.type)) {
        const parent = findLastOpenContainerBlock(open, canConsume);
        closeSatiatedBlocks(canConsume, { container: true });

        parser = getParser(parent.block.type) 
        parser.eat(cursor, parent, open);
      } else if (isEmptyLine(cursor.current)) {
        closeSatiatedBlocks(open, canConsume);
      }

      last = open.at(-1)!;
      getParser(last.block.type).eat(cursor, last);

      cursor.continue();
    }

    return root;
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
    open: BlockCtx[], 
    canConsume: boolean[]
  ): BlockCtx<ContainerNode> {
    return open.findLast((blockCtx, idx) => {
      return canConsume[idx] && isContainerNode(blockCtx.block);
    }) as BlockCtx<ContainerNode>;
  }
}

