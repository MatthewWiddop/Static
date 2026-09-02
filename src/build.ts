import fs from 'node:fs/promises';
import path from 'path';
import type { ValidDir, ValidFile } from './types/common';

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

const getOutputFilePath = (inputFile: ValidFile, outputDir: ValidDir): string {
  const { dir, name } = path.parse(inputFile);
  return path.join(outputDir, name + '.html');
}


