module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // CRA 5 默认会让 source-map-loader 扫描 node_modules。第三方包经常发布
            // 不完整的 source map，既产生大量无关警告，也会拖慢启动和构建。
            const sourceMapRule = webpackConfig.module.rules.find(rule =>
                String(rule.loader).includes('source-map-loader')
            );
            if (sourceMapRule) {
                sourceMapRule.exclude = /node_modules/;
            }

            // See https://github.com/webpack/webpack/issues/6725
            webpackConfig.module.rules.push({
                test: /\.wasm$/,
                type: 'javascript/auto',
            });
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            };

            return webpackConfig;
        }
    }
};
