import fs from 'node:fs/promises';
import path from 'path';

type ValidFile = string & {
  readonly __brand: 'ValidFile'
};

type ValidDir = string & {
  readonly __brand: 'ValidDir'
}

interface Post {
  fileName: ValidFile,
  title: string,
  date: Date,
}

const validateFile = async (filePath: string): Promise<ValidFile | null> => {
  try {
    const fileInfo = await fs.stat(filePath);
    if (fileInfo.isFile()) {
      return filePath as ValidFile;
    }
    return null;
  }
  catch {
    return null;
  }
}

const validateDir = async (filePath: string): Promise<ValidDir | null> => {
  try {
    const fileInfo = await fs.stat(filePath);
    if (fileInfo.isDirectory()) {
      return filePath as ValidDir;
    }
    return null;
  }
  catch {
    return null;
  }
}

const clearDir = async (dirPath: ValidDir): Promise<void> => {
  const files = fs.readdir(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file)
    await fs.unlink(fullPath);
  }
}

const getFilePathsInDir = async (dirPath: ValidDir): Promise<ValidFile[]> => {
  const outputFiles: ValidFile[] = [];
  const files = fs.readdir(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const validFile = await validateFile(fullPath);
    if (validFile !== null) {
      outputFiles.push(validFile);
    }
  }
  return outputFiles;
}

const getMarkdownFilePathsInDir = async (dirPath: ValidDir): Promise<ValidFile[]> => {
  const allFiles = await getFilePathsInDir(dirPath);
  return allFiles.filter(file => file.endsWith('.md'));
}

const populateOutputDir = async (outputDir: ValidDir): {
  postsDir: ValidDir
} => {
  
}

const getOutputFilePath = (inputFile: ValidFile, outputDir: ValidDir): string {
  const { dir, name } = path.parse(inputFile);
  return path.join(outputDir, name + '.html');
}

const static = async (sourceDir: ValidDir, postsDir: ValidDir): Promise<void> => {
  await clearDir(outputDir);
  const mdFilePaths = await getMarkdownFilePathsInDir(sourceDir);
  
}

// step 1: find all md files in the directory
// step 2: convert each file into html
// step 3: write the results to the output directory
