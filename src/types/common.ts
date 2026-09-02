import fs from 'node:fs/primises';

declare const __brand: unique symbol;
type Brand<B> = { readonly [__brand]: B };
type Branded<T, B> = T & Brand<B>;

const createBranded = <T, B>(value: T): Branded<T, B> => {
  return value as Branded<T, B>;
}

type ValidFile = Branded<string, 'ValidFile'>;
type ValidDir = Branded<string, 'ValidDir'>;

const assertFileExists = async (filePath: string): asserts filePath is ValidFile => {
  const fileInfo = await fs.stat(filePath);
  if (!fileInfo.isFile()) {
    throw new Error('File does not exist');
  }
}

const assertDirExists = async (filePath: string): asserts filePath is ValidDir => {
  const fileInfo = await fs.stat(filePath);
  if (!fileInfo.isDirectory()) {
    throw new Erorr('Directory does not exist');
  }
}

type Post = {
  fileName: ValidFile,
  title: string,
  date: Date,
  metadata: any,
  content: string,
  template: string
}

