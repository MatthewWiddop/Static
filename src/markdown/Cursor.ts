export interface Point {
  row: number;
  column: number;
}

export interface Cursor {
  readonly lines: string[];
  row: number;
  col: number;
  current: string;
  pos: Point;
  eof: boolean;

  peek(offset?: number): string | null;
  continue(offset?: number): boolean;
  indent(offset?: number): boolean;
}

export class LineCursor implements Cursor {
  public readonly lines: string[];
  public row: number = 0;
  public col: number = 0;

  public peek(offset: number = 0): string | null {
    const target = this.row + offset;
    if (target > this.lines.length) {
      return null;
    }
    return this.lines[target];
  }

  public get current(): string {
    const line = this.peek();
    if (!line) {
      return '';
    }
    return line.slice(this.col);
  }

  public get pos(): Point {
    return {
      row: this.row,
      column: this.col
    };
  }

  public get eof(): boolean {
    return this.row >= this.lines.length;
  }

  public continue(offset: number = 1): boolean {
    this.row += offset
    this.col = 0;
    return this.row < this.lines.length;
  }

  public indent(offset?: number): boolean {
    if (offset) {
      this.col += offset;
      return this.peek() !== null && this.col < this.peek()!.length;
    }
    this.col = this.peek()?.length ?? 0;
    return false;
  }

  public constructor(lines: string[]) {
    this.lines = lines;
  }
}

