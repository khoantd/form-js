import { defineConfig, transformWithEsbuild } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(() => {
  // For demo mode, serve from demo directory
  const isDemo = process.env.DEMO === 'true';
  
  return {
    root: isDemo ? 'demo' : 'e2e',
    define: {
      global: 'window', // necessary to fix Dragula error: `global is not defined`
    },
    plugins: [
      {
        name: 'treat-js-files-as-jsx',
        enforce: 'pre', // Run before other plugins, especially import analysis
        async transform(code, id) {
          // Only transform .js files in the demo directory
          if (!id.match(/demo\/.*\.js$/)) return null;

          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
            jsxImportSource: 'preact',
          });
        },
      },
    ],
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'preact',
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
        jsx: 'automatic',
        jsxImportSource: 'preact',
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          quietDeps: true, // Suppress deprecation warnings from dependencies (like @ibm/plex)
          // Note: Warnings from IBM Plex package's internal @import usage will still appear
          // but our own @use statement won't generate warnings
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'e2e/index.html'),
          theming: resolve(__dirname, 'e2e/theming/index.html'),
          carbon: resolve(__dirname, 'e2e/carbon/index.html'),
          demo: resolve(__dirname, 'demo/index.html'),
        },
      },
    },
  };
});
