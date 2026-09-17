import { Parser, type BlockParser } from '../Parser.ts';
import type { ParagraphNode } from '../ast.ts';
import { isEmptyLine } from '../../utils.ts';
import type { Cursor } from '../Cursor.ts';

export class ParagraphParser implements BlockParser<ParagraphNode> {
  public start(cursor: Cursor): ParagraphNode | null {
    if (isEmptyLine(cursor.current)) return null;
    return {
      type: 'Paragraph',
      text: ''
    };
  }

  public continue(cursor: Cursor, _: ParagraphNode): boolean {
    return !isEmptyLine(cursor.current); // TODO: add back detectInterrupt if not working
  }

  public eat(cursor: Cursor, block: ParagraphNode): void {
    if (!cursor.current) return;
    const newLine = cursor.current.trim();
    block.text += block.text ? '\n' + newLine : newLine;
    cursor.indent();
  }
}

const detectInterruptingBlock = (cursor: Cursor): boolean => {
  const interruptingBlock = Parser.createBlock(cursor, { interrupt: true });
  return interruptingBlock !== null;
}
