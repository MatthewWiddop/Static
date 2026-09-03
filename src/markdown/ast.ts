export type InlineNodeType = 
  | 'Image'
  | 'Emphasis'
  | 'InlineCode'
  | 'Text'
  | 'Strong'
  | 'Link';

export type NodeType = BlockNodeType | InlineNodeType | 'Document';

export interface Element {
  type: NodeType;
}

export interface Inline extends Element { }

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

