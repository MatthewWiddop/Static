import type { Source } from '../SourceLine.ts';
import type { Block } from './Block.ts';
import { trimIndentation } from '../../utils.ts';

export type FenceType = '`' | '~';

interface CodeBlockInfo {
  text: string;
  fenceType: FenceType;
  fenceCount: number;
  indent: number;
  language: string | null;
}

const FENCE_START = /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*$/;
const FENCE_END = /^ {0,3}(`{3}|~{3})\s*/;

export class CodeBlock implements Block<'CodeBlock'> {
  public readonly type = 'CodeBlock';
  public text: string;
  public fenceType: FenceType;
  public fenceCount: number;
  public indent: number;
  public language: string | null;
  static readonly interrupt = true;
  
  static start(line: Source): CodeBlock | null {
    const match = line.content.match(FENCE_START);
    if (!match) return null;

    const [, spaces, fence, language] = match;
    const indent = spaces.length;

    return new CodeBlock({
      text: '',
      fenceType: fence as FenceType,
      fenceCount: fence.length,
      indent,
      language
    });
  }

  public eat(line: Source): boolean {
    const match = line.content.match(FENCE_END);
    const fence = match?.[0];
    if (fence == null
      || fence.length < this.fenceCount 
      || fence[0] !== this.fenceType) {
      return false;
    }

    this.text += '\n' + trimIndentation(line.content, this.indent);
    return true;
  }

  constructor(info: CodeBlockInfo) {
    this.text = info.text;
    this.fenceType = info.fenceType;
    this.fenceCount = info.fenceCount;
    this.indent = info.indent;
    this.language = info.language;
  }
}

