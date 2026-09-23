import { Marker } from '../Marker.ts';
import type { Cursor } from '../Cursor.ts';
import type { BlockParser } from '../Parser.ts';
import type { ListItemNode, ListNode, BlockCtx } from '../ast.ts';
import { ListItemParser } from './ListItem.ts';
import { Parser } from '../Parser.ts';

const itemParser = new ListItemParser();
  
export class ListParser implements BlockParser<ListNode> {
  public start(cursor: Cursor): BlockCtx<ListNode> | null {
    const listMarker = Marker.parse(cursor.current);
    if (!listMarker) return null;

    const indent = cursor.col;
    const childCtx = itemParser.start(cursor)!
    Parser.open.push(childCtx);

    return {
      block: {
        type: 'List',
        ordered: listMarker.ordered,
        start: listMarker.start,
        children: [childCtx.block]
      },
      ctx: {
        indent,
        marker: listMarker,
      }
    };
  }

  public continue(cursor: Cursor, { ctx }: BlockCtx<ListNode>): boolean {
    const newMarker = Marker.parse(cursor.current);
    if (!newMarker || !Marker.same(ctx.marker, newMarker)) return false;
    
    return true;
  }

  public eat(cursor: Cursor, { block, ctx }: BlockCtx<ListNode>): void {
    cursor.col = ctx.indent;
    console.log('inside list');
    console.log(cursor.current);
    const childCtx = itemParser.start(cursor)!;
    block.children.push(childCtx.block);
    Parser.open.push(childCtx);
  }
}

