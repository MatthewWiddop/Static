import type { BlockNode, BlockNodeType, ContainerNode, DocumentNode } from './ast.ts';
import { isContainerNode } from './ast.ts';
import { LineCursor, type Cursor } from './Cursor.ts';
import { DocumentParser, BlockQuoteParser, CodeBlockParser, HeadingParser, ListParser, ListItemParser, ParagraphParser, ThematicBreakParser } from './blocks/index.ts'
import { isEmptyLine } from '../utils.ts';

export interface ParserCtx {
}

const defaultParserCtx: ParserCtx = {
}

// TODO:
// add corresponding context for certain block types and have the open block be an array of node, context pairs
// - context should be optional, since certain blocks don't use it
// - function should check that a function has a context and return the correct one e.g. text container indent
// - open blocks that are being closed should be parsed and the inline array added to the ast
// update eat function
// - function should return whether the op was a success
// - success means the open blocks that returned false can be closed

export const createParserCtx = (ctx: Partial<ParserCtx>): ParserCtx => {
  return { ...defaultParserCtx,...ctx };
}

export interface BlockParser<T extends BlockNode = BlockNode> {
  interrupt?: boolean;
  start(cursor: Cursor): T | null;
  continue(cursor: Cursor, block: T): boolean;
  eat(cursor: Cursor, block: T): void;
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

export class Parser {
  static parse(text: string): DocumentNode {
    const cursor = new LineCursor(text.split('\n'));
    const root = getParser('Document').start(cursor) as DocumentNode;
    const open: BlockNode[] = [root];
    let parser: BlockParser, last: BlockNode;

    while (isEmptyLine(cursor.current)) {
      cursor.continue();
    }

    while (!cursor.eof) {
      let canParse = open.map(block => getParser(block.type).continue(cursor, block));

      const newBlock = this.createBlock(cursor);
      last = open.at(-1)!;
      if (newBlock && !isContinuation(newBlock.type, last.type)) {
        const parent = open.findLast((block, idx) => {
          return canParse[idx] && isContainerNode(block);
        }) as ContainerNode;

        open.splice(open.indexOf(parent) + 1);
        parser = getParser(parent.type) 
        parser.eat(cursor, parent);

        let newBlock: BlockNode = parent;
        while (isContainerNode(newBlock) && newBlock.children.length > 0) {
          newBlock = newBlock.children.at(-1)!;
          open.push(newBlock);
        }
      } else if (isEmptyLine(cursor.current)) {
        open.splice(open.findLastIndex((_, idx) => {
          return canParse[idx];
        }) + 1);
      }

      last = open.at(-1)!;
      getParser(last.type).eat(cursor, last);

      console.log(open.map(block => block.type));
      
      cursor.continue();
    }

    return root;
  }

  static createBlock(cursor: Cursor, ctx: Partial<ParserCtx> = {}): BlockNode | null {
    const fullCtx = createParserCtx(ctx);
    for (const parser of Object.values(BLOCK_PARSERS)) {
      if (fullCtx.interrupt && !parser.interrupt) continue;
      const block = parser.start(cursor);
      if (block) {
        return block;
      }
    }
    return null;
  }
}

