import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();


export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  plugins: [
    vue(),
    replace({
      // Reemplazar las variables de entorno en el código fuente
      preventAssignment: true,
      values: {
        'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
        'process.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV),
      },
    }),
  ],
  base: './',
})
