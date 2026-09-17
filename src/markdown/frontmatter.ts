import { load } from 'js-yaml';

type FrontmatterData = {
  [key: string]: unknown
};

type FrontmatterResult = {
  metadata: FrontmatterData,
  body: string
}

export const parseFrontmatter = (text: string): FrontmatterResult => {
  const lines = text.split('\n'); 
  if (lines[0] !== '---') {
    return {
      metadata: {},
      body: text
    }
  }
  let lineIdx = lines.findIndex(line => line === '---')
  for (; lineIdx < lines.length && lines[lineIdx] !== '---'; lineIdx++) { }
  const yamlContent = lines.slice(1, lineIdx).join('\n');
  return {
    metadata: load(yamlContent) as FrontmatterData,
    body: lines.slice(lineIdx + 1).join('\n')
  };
}

