import type { Cursor } from './Cursor.ts';
import type { TextNode } from './ast.ts';
import { punctuation, countRepeatingChar } from '../utils.ts';

export type DelimiterType = '*' | '_' | '[' | '![';
const SPACE = ' ';

export type Delimiter = {
  text: TextNode;
  type: DelimiterType;
  canOpen: boolean;
  canClose: boolean;
  length: number;
  active: boolean;
}

export type Node<T> = T & {
  next: Node<T> | null;
  prev: Node<T> | null;

  appendNode: (node: Node<T>) => void;
  preppendNode: (node: Node<T>) => void;
  remove: () => void;
}


export type Stack<T> = {
  bottom: T | null;
  top: T | null;
  length: number;

  push: (node: T) => void;
  pop: () => T | null;
  remove: (node: T) => void;
  findLast: (callback: (node: T) => boolean, bottom: T | null) => T | null;
}

const isLeftFlanking = (prevChar: string, nextChar: string): boolean => {
  return (!punctuation.includes(nextChar) || `${punctuation} `.includes(prevChar)) &&
    nextChar !== SPACE;
}

const isRightFlanking = (prevChar: string, nextChar: string): boolean => {
  return (!punctuation.includes(prevChar) || `${punctuation} `.includes(nextChar)) &&
    prevChar !== SPACE;
}

const getCanOpen = (delim: DelimiterType, prevChar: string, nextChar: string): boolean => {
  return ['![', '[', '*'].includes(delim) || isLeftFlanking(prevChar, nextChar) && 
    (!isRightFlanking(prevChar, nextChar) || punctuation.includes(prevChar));
}

const getCanClose = (delim: DelimiterType, prevChar: string, nextChar: string): boolean => {
  return delim === '*' || delim === '_' && isRightFlanking(prevChar, nextChar) &&
    (!isLeftFlanking(prevChar, nextChar) || punctuation.includes(nextChar));
}

export class DelimiterNode implements Node<Delimiter> {
  static readonly delimiters = ['*', '_', '[', '!['];
  public text: TextNode;
  public type: DelimiterType;
  public canOpen: boolean;
  public canClose: boolean;
  public active: boolean;
  public length: number;
  public next: Node<Delimiter> | null = null;
  public prev: Node<Delimiter> | null = null;

  static start(cursor: Cursor): Node<Delimiter> | null {
    if (!cursor.current) return null;

    let matchedDelim = this.delimiters.find(delim => cursor.current.startsWith(delim));
    if (!matchedDelim) return null;

    const type = matchedDelim as DelimiterType;
    const prevChar = cursor.peek()[cursor.col - 1] ?? ' ';
    const nextChar = cursor.current[0] ?? ' ';
    const canOpen = getCanOpen(type, prevChar, nextChar);
    const canClose = getCanClose(type, prevChar, nextChar);
    const length = '_*'.includes(type)
      ? countRepeatingChar(cursor.current)
      : type.length;

    cursor.indent(length);

    return new DelimiterNode(type, canOpen, canClose, length);
  }

  public constructor(type: DelimiterType, canOpen: boolean, canClose: boolean, length: number) {
    this.type = type;
    this.canOpen = canOpen;
    this.canClose = canClose;
    this.active = true;
    this.length = length;
    this.text = {
      type: 'Text',
      text: type
    };
  }

  public appendNode(node: Node<Delimiter>): void {
    if (this.next === node) return;
    if (this.next) {
      this.next.prev = node;
      node.next = this.next;
    }

    this.next = node;
    node.prev = this;
  }

  public preppendNode(node: Node<Delimiter>): void {
    if (this.prev === node) return;
    if (this.prev) {
      this.prev.next = node;
      node.prev = this.prev;
    }

    this.prev = node;
    node.next = this;
  }

  public remove(): void {
    if (this.next) {
      this.next.prev = this.prev;
    }

    if (this.prev) {
      this.prev.next = this.next;
    }
  }
}

export class DelimiterStack implements Stack<Node<Delimiter>> {
  public length: number = 0;
  public top: Node<Delimiter> | null = null;
  public bottom: Node<Delimiter> | null = null;

  public pop(): Node<Delimiter> | null {
    if (this.length <= 0) return null;

    this.length--;
    const last = this.top;
    this.top = this.top!.prev;
    return last;
  }

  public push(node: Node<Delimiter>): void {
    this.length++;
    if (!this.top) {
      this.top = node;
      this.bottom = node;
      return;
    }

    this.top.appendNode(node);
    this.top = node;
  }

  public findLast(
    callback: (node: Node<Delimiter>) => boolean,
    bottom: Node<Delimiter> | null = null
  ): Node<Delimiter> | null {
    let currentNode: Node<Delimiter> | null = this.top;
    while (currentNode !== null && currentNode !== bottom) {
      if (callback(currentNode)) return currentNode;

      currentNode = currentNode.prev;
    }

    return null;
  }

  public remove(node: Node<Delimiter>): void {
    if (!this.findLast((searchNode) => searchNode === node)) return;

    node.remove();
    this.length--;
  }
}

