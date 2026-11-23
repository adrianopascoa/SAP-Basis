import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

const REFERENCED_AISTUDIO_ASSETS = new Set(['SAP_Logo_-_Colored_-_32x32_3644d71f.png']);

export default defineConfig(() => {
  const rootDir = import.meta.dirname;
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ and prunes unreferenced uploaded attachments
      // from dist/assets/aistudio so static deployments do not serve dead assets.
      {
        name: 'optimize-dist-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }

          const distAiStudioDir = path.resolve(distDir, 'assets/aistudio');
          if (fs.existsSync(distAiStudioDir)) {
            for (const entry of fs.readdirSync(distAiStudioDir)) {
              if (!REFERENCED_AISTUDIO_ASSETS.has(entry)) {
                fs.rmSync(path.join(distAiStudioDir, entry), {recursive: true, force: true});
              }
            }
          }
        },
      },
    ],
    build: {
      sourcemap: false,
      reportCompressedSize: true,
      rolldownOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'icons-vendor';
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
