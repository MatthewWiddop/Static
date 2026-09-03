import type { Block } from './Block';

export class BlockQuote implements Block<'BlockQuote'> {
  public readonly type = 'BlockQuote';
  static readonly startRe = /^\s{0,3}>\s?(.*)/;
  public children: Block[];
  private open: Block | null = null;

  static start(line: string): BlockQuote | null {
    const match = line.match(this.startRe);
    if (!match) {
      return null;
    }
    
    return new BlockQuote();
  }

  public eat(line: string): boolean {
    const match = line.match(BlockQuote.startRe);
    if (!match) {
      return false;
    }
    // check for paragraph continuation:
    // - if line 
    return true;
  }

  constructor(children: Block[] = []) {
    this.children = children;
  }
}

