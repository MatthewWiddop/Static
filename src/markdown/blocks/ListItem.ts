import type { Cursor } from '../Cursor.ts';
import { type BlockParser, Parser } from '../Parser.ts';
import type { ListItemNode, BlockCtx, ContainerCtx } from '../ast.ts';
import { Marker } from '../Marker.ts';
import { isEmptyLine } from '../../utils.ts';

export class ListItemParser implements BlockParser<ListItemNode> {
  start(cursor: Cursor): BlockCtx<ListItemNode> | null {
    const marker = Marker.parse(cursor.current);
    if (!marker) return null;

    cursor.indent(marker.contentIndent);
    const indent = cursor.col;
    const childCtx = Parser.createBlock(cursor);
    const children = !childCtx ? [] : [childCtx.block];
    if (childCtx) {
      Parser.open.push(childCtx);
    }

    return {
      block: {
        type: 'ListItem',
        children
      },
      ctx: {
        indent 
      }
    };
  }

  continue(cursor: Cursor, { ctx }: BlockCtx<ListItemNode>): boolean {
    if (!this.isListItemContinuation(cursor, ctx)) return false;
    
    cursor.col = ctx.indent;
    return true;
  }

  eat(cursor: Cursor, blockCtx: BlockCtx<ListItemNode>): void {
    cursor.col = blockCtx.ctx.indent;
    const childCtx = Parser.createBlock(cursor);
    if (!childCtx) return;
    blockCtx.block.children.push(childCtx.block);
    Parser.open.push(childCtx);
  }

  private isListItemContinuation(cursor: Cursor, ctx: ContainerCtx): boolean {
    const newMarker = Marker.parse(cursor.current);
    if (newMarker && newMarker.indent < ctx.indent) return false;

    const leadingText = cursor.peek().slice(cursor.col, ctx.indent);
    return isEmptyLine(leadingText);
  }
}
