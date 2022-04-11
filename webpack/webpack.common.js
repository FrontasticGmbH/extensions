var path = require('path');

module.exports = {
    target: 'node',
    entry: {
        app: './index.ts',
    },
    node: {
        __dirname: false,
        __filename: false,
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: [
                    path.resolve(__dirname, "./jest.setup.ts"),
                    path.resolve(__dirname, "./jest.config.ts"),
                ],
            },
            {
                test: /\.(mjs|js|esm)$/,
                loader: 'babel-loader',
            },
            {
                test: /\.node$/,
                loader: "node-loader",
            },
            {
                test: /\.test.ts$/,
                loader: 'ignore-loader'
            }
        ],
    },
    resolve: {
        extensions: ['.json', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.min.js',
        path: path.resolve(__dirname, '../build'),
        library: "hooksImported",
        libraryTarget: "umd"
    },
};
