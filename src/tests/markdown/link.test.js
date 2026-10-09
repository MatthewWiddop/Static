import { describe, test, expect } from '@jest/globals';
import { DelimiterNode, DelimiterStack } from '../../markdown/Delimiter';
import { LineCursor } from '../../markdown/Cursor';
import { consumeLinkOrImage } from '../../markdown/InlineParser';

const parseLink = (input, children = null) => {
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

describe('parsing inline links', () => {
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
        description: 'destination with parenthesised title'
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

  describe('spacing and new lines', () => {
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
        description: 'line ending inside a parenthesised title'
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
    ])('$input - $description', ({ input }) => {
      const { consumed, nodes, stack } = parseLink(input);

      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        { type: 'Text', text: '[' },
        { type: 'Text', text: 'link' },
        { type: 'Text', text: ']' }
      ]);
      expect(stack.length).toBe(0);
    });
  });

  describe('empty links', () => {
    test.each([
      {
        input: '[link]()',
        description: 'empty destination'
      },
      {
        input: '[]()',
        description: 'empty link text and destination'
      },
      {
        input: '[](<>)',
        description: 'empty closed target'
      },
      {
        input: '[]("")',
        description: 'empty link title'
      },
      {
        input: '[](<> "")',
        description: 'empty target and link title'
      },
    ])('$input - $description', ({ input }) => {
      const children = input.startsWith('[]')
        ? []
        : [{ type: 'Text', text: 'link' }];

      const { consumed, nodes, stack } = parseLink(input, children)

      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        {
          type: 'Link',
          text: children,
          destination: '',
          title: ''
        }
      ]);
      expect(stack.length).toBe(0);
    });
  });

  describe('balanced parentheses in destinations', () => {
    // todo: make sure escape characters are tested
    test.each([
      {
        input: '[link](abc(def)ghi)',
        destination: 'abc(def)ghi',
        description: 'balanced parentheses'
      },
      {
        input: '[link](\\(foo\\))',
        destination: '(foo)',
        description: 'parentheses inside of link destination may be escaped'
      },
      {
        input: '[link](abc(def(ghi)))',
        destination: 'abc(def(ghi))',
        description: 'nested balanced parentheses'
      },
      {
        input: '[link](foo\\(and\\(bar\\))',
        destination: 'foo(and(bar)',
        description: 'unbalanced parentheses must be escaped'
      },
      {
        input: '[link](<foo(and(bar)>)',
        destination: 'foo(and(bar)',
        description: 'closed form does not require balanced parentheses'
      }
    ])('$input - $description', ({ input, destination }) => {
      const { nodes, stack, consumed } = parseLink(input);

      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        {
          type: 'Link',
          text: [{ type: 'Text', text: 'link' }],
          destination,
          title: ''
        }
      ]);
      expect(stack.length).toBe(0);
    });
    test.each([
      {
        input: '[link](foo(and(bar))',
        description: 'unbalanced parentheses'
      }
    ])('$input - $description', ({ input }) => {
      const { nodes, stack, consumed } = parseLink(input);

      expect(consumed).toBe(true);
      expect(nodes).toEqual([
        { type: 'Text', text: '[' },
        { type: 'Text', text: 'link' },
        { type: 'Text', text: ']' }
      ]);
      expect(stack.length).toBe(0);
    });
  });
});

