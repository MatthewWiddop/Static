import { describe, test, expect } from '@jest/globals';
import { DelimiterNode, DelimiterStack } from '../../markdown/Delimiter';
import { LineCursor } from '../../markdown/Cursor';
import { consumeLinkOrImage } from '../../markdown/InlineParser';
import type { InlineNode } from '../../markdown/ast';

const parseLink = (
  input: string,
  children: InlineNode[] = [{ type: 'Text', text: 'link' }],
) => {
  const cursor = new LineCursor([input]);
  const closeBracket = input.indexOf(']');

  cursor.indent(closeBracket);

  const stack = new DelimiterStack();
  const openDelim = new DelimiterNode('[', true, false, 1);

  stack.push(openDelim);

  const nodes: InlineNode[] = [
    openDelim.text,
    ...children,
  ];

  const consumed = consumeLinkOrImage(cursor, nodes, stack);

  return {
    consumed,
    nodes,
    stack,
  };
};

describe('Parsing inline links', () => {
  describe('Basic links', () => {
    test.each([
      {
        input: '[link](/uri)',
        destination: '/uri',
        title: '',
        description: 'destination only',
      },
      {
        input: '[link](/uri "title")',
        destination: '/uri',
        title: 'title',
        description: 'destination with double-quoted title',
      },
      {
        input: '[link](/uri \'title\')',
        destination: '/uri',
        title: 'title',
        description: 'destination with single-quoted title',
      },
      {
        input: '[link](/uri (title))',
        destination: '/uri',
        title: 'title',
        description: 'destination with parenthesized title',
      },
      {
        input: '[link](https://example.com)',
        destination: 'https://example.com',
        title: '',
        description: 'absolute URI',
      },
    ])('$input - $description', ({ input, destination, title }) => {
      const { consumed, nodes, stack } = parseLink(input);
      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        {
          type: 'Link',
          text: [{ type: 'Text', text: 'link' }],
          destination,
          title
        }
      ]);
      expect(stack.length).toBe(0);
    });
  });
});
