import type { Source } from '../SourceLine.ts';

export interface Block<T extends BlockNodeType = BlockNodeType> {
  readonly type: T;
  eat(line: Source): boolean;
}

export interface BlockConstructor<T extends BlockNodeType = BlockNodeType> {
  interrupt?: boolean;
  start(line: Source): Block<T> | null;
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

