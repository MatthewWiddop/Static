import type { Block } from './Block.ts';
import { countLeadingSpaces, isEmptyLine } from '../../utils.ts';
import { tokenise } from '../lexer.ts';
import type { Source  } from '../SourceLine.ts';
import { SourceLine } from '../SourceLine.ts';

const QUOTE_REGEX = /^ {0,3}>(.*)$/;
const QUOTE_MARKER = '>';

interface BlockQuoteInfo {
  line: Source;
}

const parseBlockQuote = (line: Source): Source | null => {
  if (!QUOTE_REGEX.test(line.content)) return null;

  const leadingSpaces = line.content.indexOf(QUOTE_MARKER);
  if (leadingSpaces === -1) return null;

  const spaces = countLeadingSpaces(
    line.content.slice(leadingSpaces + QUOTE_MARKER.length)
  );

  const padding = spaces ? 1 : 0;
  const indent = leadingSpaces + QUOTE_MARKER.length + padding;

  return new SourceLine(line.raw, line.offset + indent);
};

export class BlockQuote implements Block<'BlockQuote'> {
  public readonly type = 'BlockQuote';
  static readonly interrupt = true;
  public children: Block[] = [];
  private _openBlock: Block | null = null;

  static start(line: Source): BlockQuote | null {
    const parsedLine = parseBlockQuote(line);
    if (!parsedLine) return null;
    
    return new BlockQuote({ line: parsedLine });
  }

  public eat(line: Source): boolean {
    const newLine = parseBlockQuote(line);
    if (newLine) {
      if (this.openBlock?.eat(newLine)) return true;

      this.openBlock = null;
      if (isEmptyLine(newLine.content)) return true;

      this.openBlock = tokenise(newLine)
      return this.openBlock !== null
    }

    if (this.openBlock?.eat(line)) return true;
    return false;
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

  constructor(info: BlockQuoteInfo) {
    if (info.line.content) {
      this.openBlock = tokenise(info.line);
    }
  }
}

