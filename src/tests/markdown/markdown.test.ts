import type { Block, BlockConstructor } from '../../markdown/blocks/Block.ts';
import type { Document } from '../../markdown/parser.ts';
import { Parser } from '../../markdown/parser.ts';

const SPACE = ' ';

interface TreeNode {
  type: string;
  depth: number;
  children?: Block[];
  next: number
}

export const printAST = (root: Document) => {
  const nodes: TreeNode[] = [{
    type: root.type,
    depth: 0,
    children: root.children,
    next: 0
  }];

  while (nodes.length > 0) {
    const { type, depth, children, next } = nodes.pop()!;
    if (next === 0) {
      console.log(SPACE.repeat(depth * 2) + type);
    }

    if (children && next < children.length) {
      nodes.push({
        type,
        depth,
        children,
        next: next + 1
      });

      const nextNode = children[next];
      nodes.push({ 
        type: nextNode.type,
        depth: depth + 1,
        children: nextNode.children,
        next: 0
      });
    }
  }
}

const text = [
  '> this is some text',
  'that continues on a new line',
  '> we also allow non-lazy paragraph continuation',
  '> - this is a list',
  '> - it has a second item',
  '# heading!',
  'some other text'
].join('\n');


const parser = new Parser();
const tree = parser.parse(text);
printAST(tree);
