import type { Source } from '../SourceLine.ts';
import type { Block } from './Block.ts';

interface HeadingInfo {
  depth: number;
  text: string;
}

const HEADING_REGEX = /^ {0,3}(#{1,6})(?:\s+(.*?)(?:\s+(?<!\\)#+)?\s*)$/;

export class Heading implements Block<'Heading'> {
  public readonly type = 'Heading';
  static readonly interrupt = true;
  public depth: number;
  public text: string;

  static start(line: Source): Heading | null {
    const match = line.content.match(HEADING_REGEX);
    if (!match) return null;
    const [, hashes, text] = match;

    return new Heading({
      depth: hashes.length,
      text
    });
  }

  public eat(line: Source): boolean {
    return false;
  }

  constructor(info: HeadingInfo) {
    this.depth = info.depth;
    this.text = info.text;
  }
}

