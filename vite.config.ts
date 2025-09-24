import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [preact()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@/store': resolve(__dirname, './src/store'),
            '@/websocket': resolve(__dirname, './src/websocket')
        }
    }
});
