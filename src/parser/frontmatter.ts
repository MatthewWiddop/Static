import { load } from 'js-yaml';

type FrontmatterData = {
  [key: string]: any
};

type FrontmatterResult = {
  metadata: FrontmatterData,
  body: string
}

const parseFrontmatter = (text: string): FrontmatterResult => {
  const lines = text.split('\n'); 
  if (lines[0] !== '---') {
    return {
      metadata: {},
      body: text
    }
  }
  let lineIdx: number = 1;
  for (; lines[lineIdx] !== '---'; lineIdx++) { }
  const yamlContent = lines.slice(1, lineIdx).join('\n');
  return {
    metadata: load(yamlContent) as FrontmatterData,
    body: lines.slice(lineIdx + 1).join('\n');
  };
}

export default parseFrontmatter;
