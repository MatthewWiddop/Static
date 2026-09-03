import { Block, BlockConstructor } from './Block';
import { BlockQuote } from './BlockQuote';
import { CodeBlock } from './CodeBlock';
import { Heading } from './Heading';
import { IndentedCode } from './IndentedCode';
import { List } from './List';
import { ListItem } from './ListItem';
import { Paragraph } from './Paragraph';
import { ThematicBreak } from './ThematicBreak';
export { BlockQuote, CodeBlock, Heading, IndentedCode, List, ListItem, Paragraph, ThematicBreak }

const blockParser: BlockConstructor[] = [
  ThematicBreak,
  BlockQuote,
  CodeBlock,
  Heading,
  IndentedCode,
  List,
  Paragraph
]

const tokenise = (line: string): Block => {
  for (const Parser of blockParser) {
    const block = Parser.start(line);
    if (block !== null) {
      return block;// TODO: continue
    }
  }
}
