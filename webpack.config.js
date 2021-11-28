const path = require('path');

const public = {
    watch: true,
    devtool: 'inline-source-map',
    entry: './src/public.ts',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.glsl/ ,
                type: 'asset/source',
                exclude: /node_modules/
            },
        ],
    },
    output: {
        filename: 'fractos-new.js',
        path: '\\\\NETSERVER\\www\\fractos',
        hashFunction: "sha256"
    },
    resolve: {
        extensions: ['.ts', '.js', '.glsl']
    }
};

const full = {
    watch: true,
    devtool: 'inline-source-map',
    entry: './src/index.ts',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.ts/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.glsl/ ,
                type: 'asset/source',
                exclude: /node_modules/
            },
        ],
    },
    output: {
        filename: 'fractos.min.js',
        path: path.resolve('./dist'),
    },
    resolve: {
        extensions: ['.ts', '.js', '.glsl']
    }
};

module.exports = full;
