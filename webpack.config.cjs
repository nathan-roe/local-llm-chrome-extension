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
        path: path.resolve(__dirname, 'dist'), // Output to a 'dist' folder
        filename: '[name].bundle.js', // Bundled file names (e.g., popup.bundle.js)
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './html/response.html',
            filename: 'response.html',
            chunks: ['popup'], // Only include the 'popup' bundle in response.html
        }),
        new HtmlWebpackPlugin({
            template: './html/options.html',
            filename: 'options.html',
            chunks: ['options'], // Only include the 'options' bundle in response.html
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
                test: /\.tsx?$/, // Matches .ts and .tsx files
                use: 'ts-loader',
                exclude: /node_modules/, // Exclude node_modules for faster builds
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'], // Allows importing files without specifying extension
    },
    devtool: 'inline-source-map'
};