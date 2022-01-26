module.exports = {
    pluginOptions: {
        quasar: {
            importStrategy: 'pascal',
            rtlSupport: false
        },
        electronBuilder: {
            preload: 'src/preload.ts',
            rendererProcessFile: 'src/renderer.ts',
            mainProcessFile: 'src/main-process.ts',
            mainProcessWatch: ['src/main-process-functions.ts', 'src/data-types.ts', 'src/constants.ts', 'src/renderer-functions.ts'],
            builderOptions: {
                linux: {
                    target: 'deb',
                    category: 'Game',
                    icon: 'public/favicon256x256.png'
                }
            }
        }
    },
    transpileDependencies: [
        'quasar'
    ],
    chainWebpack: config => {
        config.module
            .rule('i18n')
            .resourceQuery(/blockType=i18n/)
            .type('javascript/auto')
            .use('i18n')
            .loader('@intlify/vue-i18n-loader');
    }
}
