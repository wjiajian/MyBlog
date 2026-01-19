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

// Plugin to exclude api directory from Vite processing
const excludeApiDir = (): Plugin => {
  return {
    name: 'exclude-api-dir',
    enforce: 'pre',
    resolveId(source, _importer) {
      // Skip resolution for api directory files
      if (source.includes('/api/') || source.startsWith('api/')) {
        return { id: source, external: true }
      }
    },
    load(id) {
      // Don't load files from api directory
      if (id.includes('\\api\\') || id.includes('/api/')) {
        return ''
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [excludeApiDir(), react(), markdownLoader()],
  // Exclude api directory from Vite processing
  server: {
    watch: {
      ignored: ['**/api/**'],
    },
  },
  // Fix esbuild loader configuration
  esbuild: {
    loader: 'tsx',
  },
  optimizeDeps: {
    exclude: ['@vercel/postgres'],
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

