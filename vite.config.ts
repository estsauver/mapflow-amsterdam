import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Plugin to copy blog markdown files to dist for raw access
function copyBlogMarkdown(): Plugin {
  return {
    name: 'copy-blog-markdown',
    writeBundle() {
      const srcDir = path.resolve(__dirname, 'src/content/blog');
      const destDir = path.resolve(__dirname, 'dist/blog');

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }

      console.log(`Copied ${files.length} markdown files to dist/blog/`);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    copyBlogMarkdown(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['mapbox-gl'],
  },
  build: {
    commonjsOptions: {
      include: [/mapbox-gl/, /node_modules/],
    },
  },
}));