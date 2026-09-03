import type { Block } from './Block';

export class Paragraph implements Block<'Paragraph'> {
  public readonly type = 'Paragraph';
  public text: string;

  static start(line: string): Paragraph | null {
    if (this.isEmptyLine(line)) return null;
    const text = line.trim();
    return new Paragraph(text);
  }

  public eat(line: string): boolean {
    if (Paragraph.isEmptyLine(line)) return false;
    this.text += '\n' + line.trim();
    return true;
  }

  static isEmptyLine(line: string): boolean {
    return line.trim() === '';
  }

  constructor(text: string = '') {
    this.text = text;
  }
}

