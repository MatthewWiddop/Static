import type { Block } from './Block';
import type { ListItem, ListMarker } from './ListItem.ts';


export class List implements Block<'List'> {
  public readonly type = 'List';
  public ordered: boolean;
  public marker: ListMarker;
  public loose: boolean;
  public children: ListItem[];
  public start: number;
  public startRe = /(?:)/;

  static start(line: string): List | null {
    
  }

  public eat(line: string): boolean {
    
  }

  private addItem(child: ListItem) {
    this.children.push(child);
    child.
  }

  constructor(firstChild: ListItem, ordered: boolean, marker: ListMarker, loose: boolean, start: number = 1) {
    this.children = [];
    this.ordered = ordered;
    this.marker = marker;
    this.loose = loose;
    this.start = start;
  }
}
