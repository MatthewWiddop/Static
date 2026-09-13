export interface Source {
  raw: string;
  content: string;
  offset: number;
}

export class SourceLine implements Source {
  public raw: string;
  public offset: number;
  
  public get content() {
    return this.raw.slice(this.offset);
  }

  public constructor(raw: string, offset: number) {
    this.raw = raw;
    this.offset = offset;
  }
}

