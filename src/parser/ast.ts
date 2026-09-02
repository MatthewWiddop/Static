export interface Point {
  line: number,
  column: number,
}

export interface Position {
  start: Point,
  end: Point
}

export type NodeType =
  | 'Document'
  | 'Image'
  | 'ListItem'
  | 'List'
  | 'Paragraph'
  | 'Heading'
  | 'Emphasis'
  | 'InlineCode'
  | 'Text'
  | 'Strong'
  | 'Link'
  | 'CodeBlock'
  | 'ThematicBreak';

export interface Element {
  type: NodeType;
  position: Position;
}

export interface Block extends Element { }
export interface Inline extends Element { }

export interface Document extends Element {
  type: 'Document';
  children: Block[];
}

export interface Heading extends Block {
  type: 'Heading',
  depth: number,
}

export interface ListItem extends Block {
  type: 'ListItem';
  children: Block[]
}

export interface List extends Block {
  type: 'List';
  ordered: boolean;
  children: ListItem[];
}

export interface Paragraph extends Block {
  type: 'Paragraph';
  children: Inline[];
}

export interface CodeBlock extends Block {
  type: 'CodeBlock';
  value: string;
  language?: string;
}

export interface ThematicBreak extends Block {
  type: 'ThematicBreak'
}

export interface Image extends Inline {
  type: 'Image';
  destination: string;
  alt?: string;
}

export interface Emphasis extends Inline {
  type: 'Emphasis'
  children: Inline[]
}

export interface InlineCode extends Inline {
  type: 'InlineCode';
  value: string;
}

export interface Text extends Inline {
  type: 'Text';
  value: string;
}

export interface Strong extends Inline {
  type: 'Strong';
  children: Inline[];
}

export interface Link extends Inline {
  type: 'Link';
  destination: string;
  title?: string;
  children: Inline[];
}

