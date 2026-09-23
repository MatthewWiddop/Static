import { Parser } from '../../markdown/Parser.ts';

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

