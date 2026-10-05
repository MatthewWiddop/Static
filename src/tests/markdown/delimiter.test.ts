import { DelimiterNode } from '../../markdown/Delimiter';
import { LineCursor } from '../../markdown/Cursor';
import { describe, test, expect } from '@jest/globals';

describe('Classifying delimiter runs', () => {
  describe('left-flanking only', () => {
    test.each([
      { input: '*abc', indent: 0, description: '* run at start followed by text' },
      { input: '_abc', indent: 0, description: '_ run at start followed by text' },
      { input: '**abc', indent: 0, description: '** run at start followed by text' },
      { input: '__abc', indent: 0, description: '__ run at start followed by text' },
      { input: '**"abc"', indent: 0, description: '* run at start followed by punctuation' },
      { input: '_"abc"', indent: 0, description: '_ run at start followed by punctuation' },
      { input: '*"abc"', indent: 0, description: '* run followed by punctuation' },
      { input: '_!abc', indent: 0, description: '_ run followed by punctuation' },
      { input: '  *abc', indent: 2, description: '* run at start after indentation' },
      { input: '  _abc', indent: 2, description: '_ run at start after indentation' },
      { input: 'abc—*def', indent: 4, description: '* preceded by em dash' },
      { input: 'abc“*def', indent: 4, description: '* preceded by left quotation mark' },
      { input: 'abc。*def', indent: 4, description: '* preceded by ideographic full stop' },
      { input: 'abc—_def', indent: 4, description: '_ preceded by em dash' },
    ])('$input - $description', ({ input, indent }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);
      expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
        expect.objectContaining({
          leftFlanking: true,
          rightFlanking: false,
        }),
      );
    });
  });

  describe('right-flanking only', () => {
    test.each([
      { input: 'abc*', indent: 3, description: '* run at end preceded by text' },
      { input: 'abc_', indent: 3, description: '_ run at end preceded by text' },
      { input: 'abc**', indent: 3, description: '** run at end preceded by text' },
      { input: 'abc__', indent: 3, description: '__ run at end preceded by text' },
      { input: '"abc"**', indent: 5, description: '* run at end preceded by punctuation' },
      { input: '"abc"_', indent: 5, description: '_ run at end preceded by punctuation' },
      { input: 'abc*!', indent: 3, description: '* run followed by punctuation' },
      { input: 'abc_!', indent: 3, description: '_ run followed by punctuation' },
      { input: 'abc*  ', indent: 3, description: '* run followed by whitespace' },
      { input: 'abc_  ', indent: 3, description: '_ run followed by whitespace' },
      { input: 'abc*—def', indent: 3, description: '* followed by em dash' },
      { input: 'abc*”def', indent: 3, description: '* followed by right quotation mark' },
      { input: 'abc*。def', indent: 3, description: '* followed by ideographic full stop' },
      { input: 'abc_—def', indent: 3, description: '_ followed by em dash' },
    ])('$input - $description', ({ input, indent }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);
      expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
        expect.objectContaining({
          leftFlanking: false,
          rightFlanking: true,
        }),
      );
    });
  });

  describe('both left-flanking and right-flanking', () => {
    test.each([
      { input: 'abc*def', indent: 3, description: '* run between text' },
      { input: 'abc_def', indent: 3, description: '_ run between text' },
      { input: 'abc***def', indent: 3, description: '*** run between text' },
      { input: 'abc___def', indent: 3, description: '___ run between text' },
      { input: 'abc*def*ghi', indent: 3, description: '* run between text' },
      { input: '"abc"_"def"', indent: 5, description: '_ run between punctuation and text' },
    ])('$input - $description', ({ input, indent }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);
      expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
        expect.objectContaining({
          leftFlanking: true,
          rightFlanking: true,
        }),
      );
    });
  });

  describe('neither left-flanking nor right-flanking', () => {
    test.each([
      { input: 'abc * def', indent: 4, description: '* run surrounded by whitespace' },
      { input: 'abc _ def', indent: 4, description: '_ run surrounded by whitespace' },
      { input: 'a *** b', indent: 2, description: '*** run surrounded by whitespace' },
      { input: 'a ___ b', indent: 2, description: '___ run surrounded by whitespace' },
      { input: 'abc *  ', indent: 4, description: '* run preceded by whitespace and followed by whitespace' },
      { input: '  * abc', indent: 2, description: '* run followed by whitespace' },
      { input: '  _ abc', indent: 2, description: '_ run followed by whitespace' },
    ])('$input - $description', ({ input, indent }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);
      expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
        expect.objectContaining({
          leftFlanking: false,
          rightFlanking: false,
        }),
      );
    });
  });

  describe('Unicode whitespace', () => {
    test.each([
      { input: '\u00a0*abc', indent: 1, description: '* preceded by non-breaking space' },
      { input: 'abc*\u00a0', indent: 3, description: '* followed by non-breaking space' },
      { input: '\u2003_abc', indent: 1, description: '_ preceded by em space' },
      { input: 'abc_\u2003', indent: 3, description: '_ followed by em space' },
      { input: 'abc\u00a0*\u00a0def', indent: 4, description: '* surrounded by non-breaking spaces' },
      { input: 'abc\u2003_\u2003def', indent: 4, description: '_ surrounded by em spaces' },
    ])('$input - $description', ({ input, indent }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);

      const result = DelimiterNode.classifyDelimiterRun(cursor);

      expect(result).toEqual(
        expect.objectContaining({
          leftFlanking: expect.any(Boolean),
          rightFlanking: expect.any(Boolean),
        }),
      );
    });
  });

  describe('Testing canOpen and canClose', () => {
    test.each([
      {
        input: '*abc',
        indent: 0,
        canOpen: true,
        canClose: false,
        description: '* left-flanking only',
      },
      {
        input: 'abc*',
        indent: 3,
        canOpen: false,
        canClose: true,
        description: '* right-flanking only',
      },
      {
        input: 'abc*def',
        indent: 3,
        canOpen: true,
        canClose: true,
        description: '* both left- and right-flanking',
      },
      {
        input: '* abc',
        indent: 0,
        canOpen: false,
        canClose: false,
        description: '* followed by whitespace',
      },
      {
        input: 'abc *',
        indent: 4,
        canOpen: false,
        canClose: false,
        description: '* preceded by whitespace',
      },

      {
        input: '_abc',
        indent: 0,
        canOpen: true,
        canClose: false,
        description: '_ left-flanking only',
      },
      {
        input: 'abc_',
        indent: 3,
        canOpen: false,
        canClose: true,
        description: '_ right-flanking only',
      },
      {
        input: 'abc_def',
        indent: 3,
        canOpen: false,
        canClose: false,
        description: '_ inside a word',
      },
      {
        input: 'foo_bar_baz',
        indent: 3,
        canOpen: false,
        canClose: false,
        description: '_ inside a word',
      },

      {
        input: 'foo-_(bar)',
        indent: 4,
        canOpen: true,
        canClose: true,
        description: '_ both-flanking and preceded/followed by punctuation',
      },
      {
        input: 'foo_(bar)_baz',
        indent: 9,
        canOpen: true,
        canClose: false,
        description: '_ both-flanking but followed by alphanumeric text',
      },
      {
        input: 'foo_(bar)_.',
        indent: 9,
        canOpen: true,
        canClose: true,
        description: '_ both-flanking and followed by punctuation',
      },
    ])(
      '$input - $description',
      ({ input, indent, canOpen, canClose }) => {
        const cursor = new LineCursor([input]);
        cursor.indent(indent);

        expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
          expect.objectContaining({
            canOpen,
            canClose,
          }),
        );
      },
    );
  });

  describe('Counting delimiter length', () => {
    test.each([
      { input: '*abc', indent: 0, length: 1, description: 'single *' },
      { input: '**abc', indent: 0, length: 2, description: 'double *' },
      { input: '***abc', indent: 0, length: 3, description: 'triple *' },
      { input: '****abc', indent: 0, length: 4, description: 'four *' },
      { input: '*****abc', indent: 0, length: 5, description: 'five *' },

      { input: '_abc', indent: 0, length: 1, description: 'single _' },
      { input: '__abc', indent: 0, length: 2, description: 'double _' },
      { input: '___abc', indent: 0, length: 3, description: 'triple _' },
      { input: '____abc', indent: 0, length: 4, description: 'four _' },
      { input: '_____abc', indent: 0, length: 5, description: 'five _' },

      {
        input: 'foo***bar',
        indent: 3,
        length: 3,
        description: 'run in the middle of text',
      },
      {
        input: 'foo____bar',
        indent: 3,
        length: 4,
        description: 'underscore run in the middle of text',
      },
    ])('$input - $description', ({ input, indent, length }) => {
      const cursor = new LineCursor([input]);
      cursor.indent(indent);

      expect(DelimiterNode.classifyDelimiterRun(cursor)).toEqual(
        expect.objectContaining({
          length,
        }),
      );
    });
  });
});

