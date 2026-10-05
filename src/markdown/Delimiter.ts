import type { Cursor } from './Cursor';
import type { TextNode } from './ast';
import { punctuation, countRepeatingChar } from '../utils';

export type EmphasisType = '*' | '_';
export type DelimiterType = EmphasisType | '[' | '![';

export const isEmphasisDelimiterNode = (
  node: Node<Delimiter>
): node is Node<Delimiter> & { type: EmphasisType} => {
  return node.type === '_' || node.type === '*';
}

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
  length: number;

  push: (node: T) => void;
  pop: () => T | null;
  peek: () => T | null;
  remove: (node: T) => void;
  find: (callback: (node: Readonly<T>) => boolean, bottom: T | null, top: T | null) => T | null;
  findLast: (callback: (node: Readonly<T>) => boolean, bottom: T | null, top: T | null) => T | null;
  walkBackUntil: (callback: (node: T) => boolean) => T | null;
}

export type DelimiterRun = {
  type: DelimiterType,
  canOpen: boolean;
  canClose: boolean;
  leftFlanking: boolean;
  rightFlanking: boolean;
  length: number;
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

    const run = this.classifyDelimiterRun(cursor);
    if (!run) return null;

    const { type, canOpen, canClose, length } = run;
    cursor.indent(length);

    return new DelimiterNode(type, canOpen, canClose, length);
  }

  static classifyDelimiterRun(cursor: Cursor): DelimiterRun | null {
    const matchedDelim = this.delimiters.find(delim => cursor.current.startsWith(delim));
    if (!matchedDelim) return null;

    const type = matchedDelim as DelimiterType;
    const length = '_*'.includes(type)
      ? countRepeatingChar(cursor.current)
      : type.length;
    const prevChar = cursor.peek()[cursor.col - 1] ?? SPACE;
    const nextChar = cursor.current[length] ?? SPACE;
    const canOpen = this.getCanOpen(type, prevChar, nextChar);
    const canClose = this.getCanClose(type, prevChar, nextChar);

    return {
      type,
      canOpen,
      canClose,
      leftFlanking: this.isLeftFlanking(prevChar, nextChar),
      rightFlanking: this.isRightFlanking(prevChar, nextChar),
      length
    };
  }

  static isLeftFlanking(prevChar: string, nextChar: string): boolean {
    return (!punctuation.includes(nextChar) || `${punctuation} `.includes(prevChar)) &&
      nextChar !== SPACE;
  }

  static isRightFlanking(prevChar: string, nextChar: string): boolean {
    return (!punctuation.includes(prevChar) || `${punctuation} `.includes(nextChar)) &&
      prevChar !== SPACE;
  }

  static getCanOpen(delim: DelimiterType, prevChar: string, nextChar: string): boolean {
    return ['![', '[', '*'].includes(delim) || this.isLeftFlanking(prevChar, nextChar) && 
      (!this.isRightFlanking(prevChar, nextChar) || punctuation.includes(prevChar));
  }

  static getCanClose(delim: DelimiterType, prevChar: string, nextChar: string): boolean {
    return delim === '*' || delim === '_' && this.isRightFlanking(prevChar, nextChar) &&
      (!this.isLeftFlanking(prevChar, nextChar) || punctuation.includes(nextChar));
  }

  private constructor(type: DelimiterType, canOpen: boolean, canClose: boolean, length: number) {
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
  private top: Node<Delimiter> | null = null;
  private bottom: Node<Delimiter> | null = null;

  public peek(): Node<Delimiter> | null {
    return this.top;
  }

  public pop(): Node<Delimiter> | null {
    if (this.length <= 0) return null;

    this.length--;
    const last = this.top;
    this.top = this.top!.prev;
    if (last === this.bottom) {
      this.bottom = last;
    }

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

  public find(
    callback: (node: Readonly<Node<Delimiter>>) => boolean, 
    bottom: Node<Delimiter> | null = null,
    top: Node<Delimiter> | null = null
  ): Node<Delimiter> | null {
    let currentNode: Node<Delimiter> | null = bottom?.next ?? this.bottom;
    while (currentNode !== null && currentNode !== top) {
      if (callback(currentNode)) return currentNode;

      currentNode = currentNode.next;
    }

    return null;
  }

  public findLast(
    callback: (node: Readonly<Node<Delimiter>>) => boolean,
    bottom: Node<Delimiter> | null = null,
    top: Node<Delimiter> | null = null
  ): Node<Delimiter> | null {
    if (top && top.prev === null) return null;

    let currentNode: Node<Delimiter> | null = top?.prev ?? this.top;
    while (currentNode !== null && currentNode !== bottom) {
      if (callback(currentNode)) return currentNode;

      currentNode = currentNode.prev;
    }

    return null;
  }

  public walkBackUntil(
    callback: (node: Node<Delimiter>) => boolean,
  ): Node<Delimiter> | null {
    let currentNode: Node<Delimiter> | null = this.top;
    while (currentNode !== null) {
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

export const initOpenersBottom = (
  bottom: DelimiterNode | null = null
) => {
  const bottoms = Array.from({ length: 12 }, () => bottom);

  const getIdx = (idx: DelimiterNode): number => {
    return (idx.type === '*' ? 0 : 6) + 2 * (idx.length % 3) + (idx.canOpen ? 0 : 1);
  }

  return { 
    get: (idx: DelimiterNode): DelimiterNode | null => {
      return bottoms[getIdx(idx)]!;
    },

    set: (idx: DelimiterNode, value: DelimiterNode | null): void => {
      bottoms[getIdx(idx)] = value;
    }
  };
};

