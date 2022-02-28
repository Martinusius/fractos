const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    watch: true,
    devtool: 'inline-source-map',
    entry: './src/index.ts',
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
        filename: 'fractos.min.js',
        path: path.resolve('./dist'),
    },
    resolve: {
        extensions: ['.ts', '.js', '.glsl']
    },
    optimization: {
        minimizer: [new TerserPlugin({
            extractComments: false,
        })],
    }
};
