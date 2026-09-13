import type { Block } from './Block.ts';
import type { ParsedListMarker } from '../Marker.ts';
import { Marker } from '../Marker.ts';
import { ListItem } from './ListItem.ts';
import type { Source } from '../SourceLine.ts';
import { SourceLine } from '../SourceLine.ts';

interface ListInfo {
  marker: ParsedListMarker;
  line: Source;
}

export class List implements Block<'List'> {
  public readonly type = 'List';
  public children: ListItem[] = [];
  private _openBlock: ListItem | null = null;
  private marker: ParsedListMarker;
  private offset: number;
  static readonly interrupt = true;
  
  static start(line: Source): List | null {
    const marker = Marker.parse(line.content);
    if (!marker) return null;

    return new List({
      marker,
      line 
    });
  }

  public eat(line: Source): boolean {
    if (!this.openBlock) return this.tryNewListItem(line);

    if (line.offset < this.openBlock.offset && this.tryNewListItem(line)) {
      return true;
    }

    return this.openBlock.eat(line) ?? false;
  }

  private get openBlock(): ListItem | null {
    return this._openBlock;
  }

  private set openBlock(block: ListItem) {
    this._openBlock = block;
    if (block !== null) {
      this.children.push(block);
    }
  }

  private tryNewListItem(line: Source): boolean {
    const marker = Marker.parse(line.raw.slice(this.offset));
    if (!marker || !Marker.same(marker, this.marker)) {
      return false;
    }

    const newLine = new SourceLine(line.raw, line.offset + marker.contentIndent)
    this.openBlock = new ListItem({ line: newLine });
    return true;
  }

  constructor(info: ListInfo) {
    this.marker = info.marker;
    this.offset = info.line.offset;
    this.eat(info.line);
  }
}

