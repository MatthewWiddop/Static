import type { HeadingNode } from '../ast.ts';
import type { Cursor } from '../Cursor.ts';
import type { BlockParser } from '../Parser.ts';

const HEADING_REGEX = /^ {0,3}(#{1,6})(?:\s+(.*?)(?:\s+(?<!\\)#+)?\s*)$/;

export class HeadingParser implements BlockParser<HeadingNode> {
  public readonly interrupt = true;

  public start(cursor: Cursor): HeadingNode | null {
    const match = cursor.current?.match(HEADING_REGEX);
    if (!match) return null;
    const [, hashes] = match;

    cursor.indent(hashes.length);

    return {
      type: 'Heading',
      depth: hashes.length,
      text: ''
    };
  }

  public continue(_cursor: Cursor, _block: HeadingNode): boolean {
    return false;
  }

  public eat(cursor: Cursor, block: HeadingNode): void {
    const match = `# ${cursor.current}`.match(HEADING_REGEX);
    if (!match) return;
    cursor.indent();
    const [,, text] = match
    block.text += text.trim();
  }
}

