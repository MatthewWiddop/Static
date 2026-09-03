export interface Block<T extends BlockNodeType = BlockNodeType> {
  readonly type: T;
  eat(line: string): boolean;
}

export interface BlockConstructor<T extends Block = Block> {
  start(line: string): T | null;
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

