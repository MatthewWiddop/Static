import type { Block } from './Block';
import type { List } from './List';

export type BulletListMarker = '-' | '+' | '*';
export type OrderedListMarker = '.' | ')';
export type ListMarker = BulletListMarker | OrderedListMarker;

export class ListItem implements Block<'ListItem'> {
  public readonly type = 'ListItem';
  public children: Block[];
  public parent: List;

  static start(line: string): ListItem | null {
    // TODO: finish block parsing
  }

  public eat(line: string): boolean {
    
  }

  constructor(
}
