import path from 'path'

declare const __dirname: string

const config = {
  project: [
    path.join(__dirname, './tsconfig.json'),
    path.join(__dirname, './tsconfig.node.json'),
  ],
}

export default config
