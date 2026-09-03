import type { Block } from './Block';

export class IndentedCode implements Block<'IndentedCode'> {
  public readonly type = 'IndentedCode';

  static start(line: string): IndentedCode | null {

  }

  public eat(line: string): boolean {
      
  }
}
