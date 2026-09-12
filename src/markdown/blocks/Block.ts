export interface Block<T extends BlockNodeType = BlockNodeType> {
  readonly type: T;
  eat(line: string): boolean;
}

export interface BlockConstructor<T extends BlockNodeType = BlockNodeType> {
  interrupt?: boolean;
  start(line: string): Block<T> | null;
}

export type BlockNodeType = 
  | 'Heading'
  | 'ListItem'
  | 'List'
  | 'Paragraph'
  | 'CodeBlock'
  | 'IndentedCode'
  | 'BlockQuote'
  | 'ThematicBreak';

