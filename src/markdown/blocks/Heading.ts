import type { HeadingNode, BlockCtx } from '../ast.ts';
import type { Cursor } from '../Cursor.ts';
import type { BlockParser } from '../Parser.ts';

const HEADING_REGEX = /^ {0,3}(#{1,6})(?:\s+(.*?)(?:\s+(?<!\\)#+)?\s*)$/;

export class HeadingParser implements BlockParser<HeadingNode> {
  public start(cursor: Cursor): BlockCtx<HeadingNode> | null {
    const match = cursor.current?.match(HEADING_REGEX);
    if (!match) return null;
    const [, hashes] = match;

    cursor.indent(hashes.length);

    return {
      block: {
        type: 'Heading',
        depth: hashes.length
      },
      ctx: {
        text: ''
      }
    };
  }

  public continue(_cursor: Cursor, _blockCtx: BlockCtx<HeadingNode>): boolean {
    return false;
  }

  public eat(cursor: Cursor, { ctx }: BlockCtx<HeadingNode>): void {
    const match = `# ${cursor.current}`.match(HEADING_REGEX);
    if (!match) return;
    cursor.indent();
    const [,, text] = match;
    ctx.text += text.trim();
  }
}

