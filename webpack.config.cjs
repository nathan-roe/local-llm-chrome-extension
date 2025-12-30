const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    // Use 'development' or 'production' mode
    mode: 'development',
    entry: {
        popup: './react/response.tsx',
        options: './react/options.tsx',
        background: './chrome/background.ts',
        content: './chrome/content.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './html/response.html',
            filename: 'response.html',
            chunks: ['popup'],
        }),
        new HtmlWebpackPlugin({
            template: './html/options.html',
            filename: 'options.html',
            chunks: ['options'],
        }),
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: path.resolve(__dirname, 'dist') },
                { from: 'assets', to: path.resolve(__dirname, 'dist/assets') },

            ],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
    },
    devtool: 'inline-source-map'
};