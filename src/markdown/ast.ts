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
  | ThematicBreakNode;

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

export type BlockCtxMap = {
  Document: {},
  Heading: TextBlockCtx,
  Paragraph: TextBlockCtx,
  List: ListNodeCtx,
  ListItem: ContainerCtx,
  CodeBlock: CodeBlockCtx | FencedCodeBlockCtx,
  BlockQuote: ContainerCtx,
  ThematicBreak: {}
}

export type BlockCtx<T extends BlockNode = BlockNode> = {
  block: T;
  ctx: BlockCtxMap[T['type']];
}

export type InlineNodeType = InlineNode['type'];

export type BulletListMarker = '-' | '+' | '*';
export type OrderedListMarker = '.' | ')';
export type ListMarker = BulletListMarker | OrderedListMarker;

export type ContainerNode = {
  type: BlockNodeType;
  children: BlockNode[];
}

export type ContainerCtx = {
  indent: number;
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

export type TextBlockCtx = {
  text: string;
}

export type DocumentNode = ContainerNode & {
  type: 'Document';
}

export type DocumentWrapper = {
  block: DocumentNode;
}

export type HeadingNode = LeafNode & {
  type: 'Heading';
  depth: number;
}

export type HeadingWrapper = {
  block: HeadingNode;
}

export type ParagraphNode = LeafNode & {
  type: 'Paragraph';
}

export type ListNode = ContainerNode & {
  type: 'List';
  ordered: boolean;
  start?: number;
  children: ListItemNode[];
}

export type ListNodeCtx = ContainerCtx & {
  marker: ParsedListMarker
}

export type ListItemNode = ContainerNode & {
  type: 'ListItem';
}

export type CodeBlockNode = LeafNode & {
  type: 'CodeBlock';
  language?: string;
  text: string;
}

export type FenceType = '`' | '~';

export type CodeBlockCtx = ContainerCtx & {
  fenced: boolean;
}

export type FencedCodeBlockCtx = CodeBlockCtx & {
  fenceType: FenceType;
  fenceCount: number;
  fenceIndent: number;
}

export const isFencedCodeBlockNode = (ctx: CodeBlockCtx): ctx is FencedCodeBlockCtx => {
  return ctx.fenced;
}

export type BlockQuoteNode = ContainerNode & {
  type: 'BlockQuote';
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

