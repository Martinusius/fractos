import glsl from 'vite-plugin-glsl';
import path from 'path';
import { defineConfig } from 'vite';

const formatNames = {
    'umd': 'min',
    'es': 'module'
};

export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'Fractos',
            fileName: (format) => `fractos.${formatNames[format]}.js`
        },
        rollupOptions: {
            external: ['three'],
            output: {
                globals: {
                    three: 'THREE'
                },
                inlineDynamicImports: true
            },
        }
    },
    publicDir: false,
    plugins: [glsl()]
})