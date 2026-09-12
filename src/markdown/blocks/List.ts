import type { Block } from './Block.ts';
import type { ListMarker } from './ListItem.ts';
import { ListItem } from './ListItem.ts';

interface ListInfo {
  ordered: boolean;
  markerChar: ListMarker;
  start: number;
}

export class List implements Block<'List'> {
  public readonly type = 'List';
  public ordered: boolean;
  private markerChar: ListMarker;
  public children: ListItem[] = [];
  public start: number;
  static readonly listItemRe = /^( {0,3}[-+*]|\d{1,9}[.)])(?: .*)?$/;
  static readonly unorderedListMarkers = [ '-', '+', '*' ];
  static readonly interrupt = true;
  private _openBlock: ListItem | null = null;
  
  static start(line: string): List | null {
    const match = line.match(this.listItemRe);
    if (!match) {
      return null;
    }

    const { ordered, markerChar, start } = this.getListInfo(match[1]);
    return new List(new ListItem(line), ordered, markerChar, start);
  }

  public eat(line: string): boolean {
    if (this.openBlock?.eat(line)) {
      return true;
    }

    const match = line.match(List.listItemRe);
    if (!match) {
      return false;
    }

    const { markerChar } = List.getListInfo(match[1]);
    if (markerChar !== this.markerChar) {
      return false;
    }

    this.openBlock = new ListItem(line);
    return true;
  }

  static getListInfo(marker: string): ListInfo {
    const ordered = !this.unorderedListMarkers.includes(marker);
    const markerChar = marker.at(-1)! as ListMarker;
    const numberLength = marker.length - 1;
    const start = ordered ? Number(marker.slice(0, numberLength)) : -1;
    return { ordered, start, markerChar };
  }

  private get openBlock(): ListItem | null {
    return this._openBlock;
  }

  private set openBlock(block: ListItem) {
    this._openBlock = block;
    this.children.push(block);
  }

  constructor(firstItem: ListItem, ordered: boolean, markerChar: ListMarker, start: number) {
    this.openBlock = firstItem;
    this.ordered = ordered;
    this.markerChar = markerChar;
    this.start = start;
  }
}

