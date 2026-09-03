import type { Block } from './Block';

export class Heading implements Block<'Heading'> {
  public readonly type = 'Heading';
  public text: string;
  public depth: number;

  static start(line: string): Heading | null {
    const startRe = /^ {0,3}(#{1,6})(?:\s+(.*?)(?:\s+(?<!\\)#+)?\s*)$/;
    const match = line.match(startRe);
    if (!match) {
      return null;
    }
    const depth = match[1].length;
    const text = match[2];

    return new Heading(text, depth);
  }

  public eat(line: string): boolean {
    return false;
  }

  constructor(text: string, depth: number) {
    this.text = text;
    this.depth = depth;
  }
}

