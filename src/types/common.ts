declare const __brand: unique symbol;
type Brand<B> = { readonly [__brand]: B };
type Branded<T, B> = T & Brand<B>;

const createBranded = <T, B>(value: T): Branded<T, B> => {
  return value as Branded<T, B>;
}

export type ValidFile = Branded<string, 'ValidFile'>;
export type ValidDir = Branded<string, 'ValidDir'>;

export const createFullOptions = <T>(options: Partial<T>, defaults: T): T => {
  return { ...defaults,...options };
}

type Post = {
  fileName: ValidFile,
  title: string,
  date: Date,
  metadata: any,
  content: string,
  template: string
}

