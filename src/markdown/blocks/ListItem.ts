import type { Cursor } from '../Cursor.ts';
import { type BlockParser, Parser } from '../Parser.ts';
import type { ListItemNode } from '../ast';
import { Marker } from '../Marker.ts';

export class ListItemParser implements BlockParser<ListItemNode> {
  start(cursor: Cursor): ListItemNode | null {
    const marker = Marker.parse(cursor.current);
    if (!marker) return null;

    cursor.indent(marker.contentIndent);
    const indent = cursor.col;
    const child = Parser.createBlock(cursor);
    const children = !child ? [] : [child];

    return {
      type: 'ListItem',
      indent,
      children
    };
  }

  continue(cursor: Cursor, block: ListItemNode): boolean {
    const marker = Marker.parse(cursor.current)
    if (!marker || marker.indent < block.indent) return false;
    
    cursor.col = block.indent;
    return false;
  }

  eat(cursor: Cursor, block: ListItemNode): void {
    cursor.col = block.indent;
    const child = Parser.createBlock(cursor);
    if (!child) return;
    block.children.push(child);
  }
}
