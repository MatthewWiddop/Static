import { Parser } from '../../markdown/Parser.ts';
import type { BlockNode } from '../../markdown/ast.ts';

const SPACE = ' ';

type TreeNode = BlockNode & {
  currentDepth: number;
  children?: BlockNode[];
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
    const { type, currentDepth, children, next } = nodes.pop()!;
    if (next === 0) {
      console.log(SPACE.repeat(currentDepth * 2) + type);
    }

    if (children && next < children.length) {
      nodes.push({
        type,
        currentDepth,
        children,
        next: next + 1
      } as TreeNode);

      const nextNode = children[next];
      nodes.push({ 
        type: nextNode.type,
        depth: currentDepth + 1,
        next: 0
      } as TreeNode);
    }
  }
}

const text = [
  'this is a paragraph',
  'that continues on the next line',
  '- this is a list item',
  'that continues on the next line',
  '- is this on the same list item?',
  '',
  '  this should be part of the same list',
  '  - we then get a sub list',
  '',
  '  > here\'s a block quote too!',
  '  > I can\'t believe it\'s working'
].join('\n');


const tree = Parser.parse(text);
console.log(JSON.stringify(tree, null, 2));

