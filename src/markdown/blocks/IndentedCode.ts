import type { Block } from './Block.ts';
import type { Source } from '../SourceLine.ts';
import { isEmptyLine, countLeadingSpaces } from '../../utils.ts';

const INDENT = 4;
const SPACE = ' ';

interface IndentedCodeInfo {
  text: string;
}

export class IndentedCode implements Block<'IndentedCode'> {
  public readonly type = 'IndentedCode';
  public text: string;
  private innerEmptyLines: string = '';

  static start(line: Source): IndentedCode | null {
    let lineContent: string;
    if (!line.content.startsWith(SPACE.repeat(INDENT))
        || isEmptyLine(lineContent = line.content.slice(INDENT))) {
      return null;
    }

    return new IndentedCode({ text: lineContent });
  }

  public eat(line: Source): boolean {
    if (countLeadingSpaces(line.content)) {
      return false;
    }

    const lineContent = line.content.slice(INDENT);
    if (isEmptyLine(lineContent)) {
      this.innerEmptyLines += '\n' + lineContent;
    } else {
      if (this.innerEmptyLines) {
        this.text += '\n' + this.innerEmptyLines;
        this.innerEmptyLines = '';
      }
      this.text += '\n' + lineContent;
    }

    return true;
  }

  private constructor(info: IndentedCodeInfo) {
    this.text = info.text;
  }
}
