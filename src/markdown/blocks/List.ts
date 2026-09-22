import { Marker } from '../Marker.ts';
import type { Cursor } from '../Cursor.ts';
import type { BlockParser } from '../Parser.ts';
import type { ListItemNode, ListNode, BlockCtx } from '../ast.ts';
import { ListItemParser } from './ListItem.ts';

const itemParser = new ListItemParser();
  
export class ListParser implements BlockParser<ListNode> {
  public readonly interrupt = true;
  
  public start(cursor: Cursor): BlockCtx<ListNode> | null {
    const listMarker = Marker.parse(cursor.current);
    if (!listMarker) return null;

    return {
      block: {
        type: 'List',
        ordered: listMarker.ordered,
        start: listMarker.start,
        children: itemParser.start(cursor)
      },
      ctx: {
        indent: cursor.col,
        marker: listMarker,
      }
    };
  }

  public continue(cursor: Cursor, { ctx }: BlockCtx<ListNode>): boolean {
    const newMarker = Marker.parse(cursor.current);
    if (!newMarker || !Marker.same(ctx.marker, newMarker)) return false;
    
    return true;
  }

  public eat(cursor: Cursor, { block, ctx }: ListNode, open: BlockCtx[]): void {
    cursor.col = ctx.indent;
    const childCtx = itemParser.start(cursor);
    block.children.push(...childCtx.block);
    open.
  }
}

