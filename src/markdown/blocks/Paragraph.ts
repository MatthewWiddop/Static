import type { Block } from './Block.ts';
import { isEmptyLine } from '../../utils.ts';

export class Paragraph implements Block<'Paragraph'> {
  public readonly type = 'Paragraph';
  public text: string;

  static start(line: string): Paragraph | null {
    if (isEmptyLine(line)) return null;
    const text = line.trim();
    return new Paragraph(text);
  }

  public eat(line: string): boolean {
    if (isEmptyLine(line)) return false;
    this.text += '\n' + line.trim();
    return true;
  }

  constructor(text: string = '') {
    this.text = text;
  }
}

