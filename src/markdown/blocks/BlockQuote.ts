import { Parser, type BlockParser } from '../Parser.ts';
import type { Cursor } from '../Cursor';
import { countLeadingSpaces } from '../../utils.ts';
import type { BlockCtx, BlockQuoteNode } from '../ast.ts';

const QUOTE_REGEX = /^ {0,3}>/;
const QUOTE_MARKER = '>';

const parseBlockQuote = (cursor: Cursor): number | null => {
  if (!QUOTE_REGEX.test(cursor.current)) return null;

  const leadingSpaces = cursor.current.indexOf(QUOTE_MARKER);
  if (leadingSpaces === -1) return null;

  const spaces = countLeadingSpaces(
    cursor.current.slice(leadingSpaces + QUOTE_MARKER.length)
  );

  const padding = spaces ? 1 : 0;
  return leadingSpaces + QUOTE_MARKER.length + padding;
};

export class BlockQuoteParser implements BlockParser<BlockQuoteNode> {
  public start(cursor: Cursor): BlockCtx<BlockQuoteNode> | null {
    let quoteIndent = parseBlockQuote(cursor);
    if (!quoteIndent) return null;

    cursor.indent(quoteIndent);
    const childCtx = Parser.createBlock(cursor);
    const children = childCtx ? [childCtx.block] : [];
    if (childCtx) {
      Parser.open.push(childCtx);
    }

    return {
      block: {
        type: 'BlockQuote',
        children
      },
      ctx: {
        indent: quoteIndent,
      }
    };
  }

  public continue(cursor: Cursor, _blockCtx: BlockCtx<BlockQuoteNode>): boolean {
    const quoteIndent = parseBlockQuote(cursor);
    if (!quoteIndent) return false;

    cursor.indent(quoteIndent);
    return true;
  }

  public eat(cursor: Cursor, blockCtx: BlockCtx<BlockQuoteNode>): void {
    cursor.col = blockCtx.ctx.indent;
    const childCtx = Parser.createBlock(cursor);
    if (!childCtx) return;

    blockCtx.block.children.push(childCtx.block);
    Parser.open.push(childCtx);
  }
}

