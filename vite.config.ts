import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to load markdown files as raw strings
const markdownLoader = () => {
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
})