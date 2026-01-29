import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Custom plugin to load markdown files as raw strings
const markdownLoader = (): Plugin => {
  return {
    name: 'markdown-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.md')) {
        return `export default ${JSON.stringify(code)};`
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), markdownLoader()],
  // Fix esbuild loader configuration
  esbuild: {
    loader: 'tsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.js': 'js',
        '.jsx': 'jsx',
      },
    },
  },
})


