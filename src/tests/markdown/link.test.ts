import { describe, test, expect } from '@jest/globals';
import { DelimiterNode, DelimiterStack } from '../../markdown/Delimiter';
import { LineCursor } from '../../markdown/Cursor';
import { consumeLinkOrImage } from '../../markdown/InlineParser';
import type { InlineNode } from '../../markdown/ast';

const parseLink = (
  input: string, children?: InlineNode[]
) => {
  const cursor = new LineCursor(input.split('\n'));
  const closeBracket = input.indexOf(']');
  children ??= [{ type: 'Text', text: 'link' }];

  cursor.indent(closeBracket);

  const stack = new DelimiterStack();
  const openDelim = new DelimiterNode('[', true, false, 1);

  stack.push(openDelim);
  const nodes = [ openDelim.text, ...children ];

  const consumed = consumeLinkOrImage(cursor, nodes, stack);

  return {
    consumed,
    nodes: children,
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
        description: 'destination only'
      },
      {
        input: '[link](/uri "title")',
        destination: '/uri',
        title: 'title',
        description: 'destination with double-quoted title'
      },
      {
        input: '[link](/uri \'title\')',
        destination: '/uri',
        title: 'title',
        description: 'destination with single-quoted title'
      },
      {
        input: '[link](/uri (title))',
        destination: '/uri',
        title: 'title',
        description: 'destination with parenthesized title'
      },
      {
        input: '[link](https://example.com)',
        destination: 'https://example.com',
        title: '',
        description: 'absolute URI'
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

  describe('Spacing and new lines', () => {
    test.each([
      {
        input: '[link](/uri        )',
        destination: '/uri',
        title: '',
        description: 'trailing spaces after destination'
      },
      {
        input: '[link](     /uri)',
        destination: '/uri',
        title: '',
        description: 'leading spaces after destination'
      },
      {
        input: '[link](/uri    "title")',
        destination: '/uri',
        title: 'title',
        description: 'spaces between destination and title'
      },
      {
        input: '[link](    "title")',
        destination: '/uri',
        title: 'title',
        description: 'leading spaces before title'
      },
      {
        input: '[link]("title"    )',
        destination: '/uri',
        title: 'title',
        description: 'trailing spaces before title'
      },
      {
        input: '[link](\t/uri\t"title"\t)',
        destination: '/uri',
        title: 'title',
        description: 'tabs wrapping around destination and title'
      },
      {
        input: '[link](/uri\n"title")',
        destination: '/uri',
        title: 'title',
        description: 'new line before title'
      },
      {
        input: '[link](/uri "title"\n)',
        destination: '/uri',
        title: 'title',
        description: 'new line before closing parenthesis'
      }, 
      {
        input: '[link](\n/uri\n"title"\n)',
        destination: '/uri',
        title: 'title',
        description: 'new lines wrapping around destination and title'
      }, 
      {
        input: '[link](  \n  /uri  \n  "title"  \n)',
        destination: '/uri',
        title: 'title',
        description: 'mix of spaces and new lines'
      }, 
      {
        input: '[link](/uri (title\nhere))',
        destination: '/uri',
        title: 'title\nhere',
        description: 'line ending inside a parenthesized title'
      },
    ])('$input - $description', ({ input, destination, title }) => {
      const { consumed, nodes, stack } = parseLink(input);

      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        {
          type: 'Link',
          destination,
          title,
          text: [{ type: 'Text', text: 'link' }]
        }
      ]);
      expect(stack.length).toBe(0);
    });
    test.each([
      {
        input: '[link]\n(/url "title")',
        destination: '/url',
        title: 'title',
        description: 'new line before link text and opening parenthesis is invalid'
      },
      {
        input: '[link](</ur\ni>)',
        destination: '/uri',
        title: '',
        description: 'new line inside closed target destination' 
      },
    ])('$input - $description', ({ input, description, title }) => {
      const { consumed, nodes, stack } = parseLink(input);

      expect(consumed).toBe(false);
      // todo: check for side effects
    });
  });

  describe('Empty links', () => {

  });
});
