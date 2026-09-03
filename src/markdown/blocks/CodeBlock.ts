import type { Block } from './Block';

export type FenceType = '`' | '~';

export class CodeBlock implements Block<'CodeBlock'> {
  public readonly type = 'CodeBlock';
  public text: string;
  public fenceType: FenceType;
  public fenceCount: number;
  public indentation: number;
  public language: string;
  
  static start(line: string): CodeBlock | null {
    const startRe = /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
    const match = line.match(startRe);
    if (!match) {
      return null;
    }
    const indentation = match[1].length;
    const fence = match[2];

    return new CodeBlock(
      '',
      fence[0] as FenceType,
      fence.length,
      indentation,
      match[2]
    );
  }

  public eat(line: string): boolean {
    const endRe = /^ {0,3}(`{3}|~{3})\s*/;
    const match = line.match(endRe);
    const fence = match?.[0];
    if (fence == null
      || fence.length < this.fenceCount 
      || fence[0] !== this.fenceType) {
      return false;
    }
    this.text += '\n' + trimIndentation(line);
    return true;
  }

  static trimIndentation(line: string, max: number): string {
    let i;
    for (i = 0; i < max && line[i] === ' '; i++) { }
    return line.slice(i);
  }

  constructor(text: string, fenceType: FenceType, fenceCount: number, indentation: number, language: string = '') {
    this.text = text;
    this.fenceType = fenceType;
    this.fenceCount = fenceCount;
    this.indentation = indentation;
    this.language = language;
  }
}
