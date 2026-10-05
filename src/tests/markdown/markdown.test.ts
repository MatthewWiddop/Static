import { Parser } from '../../markdown/Parser';

const text = [
  '**Testing **inline** parsing** now'
].join('\n');


const tree = Parser.parse(text);
console.log(JSON.stringify(tree, null, 2));

