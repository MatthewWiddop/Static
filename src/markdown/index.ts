export default class Markdown {
    public parse(text: string) {
      // TODO: Remove and replace with BlockParser
      // TODO: Implement Cursor object, which has all lines, current line, and functions for advancing the cursor, reading current line, and peeking based on some offset (defaulting to 1)
      // TODO: tryParse method for each parser, which increments the Cursor and returns the result - add to ast in main parser and continue until cursor is at the end. The cursor may also need to output a line with a column index for recursive parsing, this way the written logic can be maintained
      // each object should have a custom parser, e.g. list has a parser for its children, where it continues but only accepts new blocks at a certain indentation
    }
}
