const path = require('path');

module.exports = {
    watch: true,
    devtool: 'inline-source-map',
    entry: {
        'fractos-full': './src/index.ts',
        fractos: './src/public.ts'
    },
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
        globalObject: 'self',
        filename: '[name].js',
        path: path.resolve('./dist'),
    },
    resolve: {
        extensions: ['.ts', '.js', '.glsl']
    }
};