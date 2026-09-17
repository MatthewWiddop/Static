import { Marker } from '../Marker.ts';
import type { Cursor } from '../Cursor.ts';
import type { BlockParser } from '../Parser.ts';
import type { ListItemNode, ListNode } from '../ast.ts';
import { ListItemParser } from './ListItem.ts';

const itemParser = new ListItemParser();
  
const getListChildren = (cursor: Cursor): ListItemNode[] => {
  const child = itemParser.start(cursor);
  return !child ? [] : [child];
}

export class ListParser implements BlockParser<ListNode> {
  public readonly interrupt = true;
  
  public start(cursor: Cursor): ListNode | null {
    const listMarker = Marker.parse(cursor.current);
    if (!listMarker) return null;


    return {
      type: 'List',
      indent: cursor.col,
      marker: listMarker,
      children: getListChildren(cursor)
    };
  }

  public continue(cursor: Cursor, block: ListNode): boolean {
    const newMarker = Marker.parse(cursor.current);
    if (!newMarker || !Marker.same(block.marker, newMarker)) return false;
    
    return true;
  }

  public eat(cursor: Cursor, block: ListNode): void {
    cursor.col = block.indent;
    const children = getListChildren(cursor);
    block.children.push(...children);
  }
}

