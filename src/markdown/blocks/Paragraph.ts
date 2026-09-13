import type { Block } from './Block.ts';
import type { Source } from '../SourceLine.ts';
import { isEmptyLine } from '../../utils.ts';
import { tokenise } from '../lexer.ts';

interface ParagraphInfo {
  text: string;
}

export class Paragraph implements Block<'Paragraph'> {
  public readonly type = 'Paragraph';
  public text: string;

  static start(line: Source): Paragraph | null {
    if (isEmptyLine(line.content)) return null;
    const text = line.content.trim();
    return new Paragraph({ text });
  }

  public eat(line: Source): boolean {
    if (isEmptyLine(line.raw) 
      || detectInterruptingBlock(line)) {
      return false;
    }

    this.text += '\n' + line.content.trim();
    return true;
  }

  constructor(info: ParagraphInfo) {
    this.text = info.text;
  }
}

const detectInterruptingBlock = (line: Source): boolean => {
  const interruptingBlock = tokenise(line, { inParagraph: true });
  return interruptingBlock !== null;
}
