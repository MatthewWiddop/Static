import { Parser, type BlockParser } from '../Parser.ts';
import type { Cursor } from '../Cursor';
import { countLeadingSpaces } from '../../utils.ts';
import type { BlockQuoteNode } from '../ast.ts';

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
  public readonly interrupt = true;

  public start(cursor: Cursor): BlockQuoteNode | null {
    let quoteIndent = parseBlockQuote(cursor);
    if (!quoteIndent) return null;

    cursor.indent(quoteIndent);
    const child = Parser.createBlock(cursor);
    const children = !child ? [] : [child];

    return {
      type: 'BlockQuote',
      indent: quoteIndent,
      children
    };
  }

  public continue(cursor: Cursor, _: BlockQuoteNode): boolean {
    const quoteIndent = parseBlockQuote(cursor);
    if (!quoteIndent) return false;

    cursor.indent(quoteIndent);
    return true;
  }

  public eat(cursor: Cursor, block: BlockQuoteNode): void {
    cursor.col = block.indent;
    const child = Parser.createBlock(cursor);
    if (!child) return;

    block.children.push(child);
  }
}

