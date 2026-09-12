import { ThematicBreak, BlockQuote, CodeBlock, Heading, IndentedCode, List, Paragraph } from './blocks/index.ts';
import type { Block, BlockConstructor } from './blocks/index.ts';

export interface TokeniseCtx {
  inParagraph: boolean;
}

const defaultCtx: TokeniseCtx = {
  inParagraph: false
};

const blockParsers: BlockConstructor[] = [
  ThematicBreak,
  BlockQuote,
  CodeBlock,
  Heading,
  // IndentedCode,
  List,
  Paragraph
]

export const tokenise = (line: string, ctx: TokeniseCtx = defaultCtx): Block | null => {
  const validParsers = blockParsers.filter(parser => {
    return !ctx.inParagraph || parser.interrupt
  });
  for (const BlockParser of validParsers) {
    const block = BlockParser.start(line);
    if (block !== null) {
      return block;
    }
  }
  return null;
}

