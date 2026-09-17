import type { ParsedListMarker } from './Marker.ts';

export type BlockNode =
  | ContainerNode
  | LeafNode
  | DocumentNode
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | BlockQuoteNode
  | ThematicBreakNode

export type InlineNode =
  | TextNode
  | EmphasisNode
  | StrongNode
  | InlineCodeNode
  | LinkNode
  | ImageNode;


export type BlockNodeType = 
  | 'Document'
  | 'Heading'
  | 'Paragraph'
  | 'List'
  | 'ListItem'
  | 'CodeBlock'
  | 'BlockQuote'
  | 'ThematicBreak';

export type InlineNdeType = InlineNode['type'];

export type BulletListMarker = '-' | '+' | '*';
export type OrderedListMarker = '.' | ')';
export type ListMarker = BulletListMarker | OrderedListMarker;

export type ContainerNode = {
  type: BlockNodeType;
  indent: number;
  children: BlockNode[];
}

export const isContainerNode = (node: BlockNode): node is ContainerNode => {
  return (
    node.type === 'Document' ||
    node.type === 'List' ||
    node.type === 'ListItem' ||
    node.type === 'BlockQuote'
  );
}

export type LeafNode = {
  type: BlockNodeType;
}

export const isLeafNode = (node: BlockNode): node is LeafNode => {
  return (
    node.type === 'Heading' ||
    node.type === 'Paragraph' ||
    node.type === 'CodeBlock' || 
    node.type === 'ThematicBreak'
  );
}

export type TextBlockNode = LeafNode & {
  text: string;
}

export const isTextBlockNode = (node: BlockNode): node is TextBlockNode => {
  return (
    node.type === 'Heading' ||
    node.type === 'Paragraph' ||
    node.type === 'CodeBlock'
  );
}

export type DocumentNode = ContainerNode & {
  type: 'Document';
}

export type HeadingNode = TextBlockNode & {
  type: 'Heading';
  depth: number;
}

export type ParagraphNode = TextBlockNode & {
  type: 'Paragraph';
}

export type ListNode = ContainerNode & {
  type: 'List';
  marker: ParsedListMarker;
  children: ListItemNode[];
}

export type ListItemNode = ContainerNode & {
  type: 'ListItem';
}

export type CodeBlockNode = TextBlockNode & {
  type: 'CodeBlock';
  fenced: boolean;
  indent: number;
}


export type FenceType = '`' | '~';

export type FencedCodeBlockNode = CodeBlockNode & {
  language?: string;
  fenceType: FenceType;
  fenceCount: number;
  fenceIndent: number;
}

export const isFencedCodeBlockNode = (block: CodeBlockNode): block is FencedCodeBlockNode => {
  return block.fenced;
}

export type BlockQuoteNode = ContainerNode & {
  type: 'BlockQuote';
  children: BlockNode[];
}

export type ThematicBreakNode = LeafNode & {
  type: 'ThematicBreak';
}

export type ImageNode = {
  type: 'Image';
  destination: string;
  alt?: string;
}

export type EmphasisNode = {
  type: 'Emphasis';
  text: string;
}

export type InlineCodeNode = {
  type: 'InlineCode';
  value: string;
}

export type TextNode = {
  type: 'Text';
  value: string;
}

export type StrongNode = {
  type: 'Strong';
}

export type LinkNode = {
  type: 'Link';
  destination: string;
  title?: string;
}
