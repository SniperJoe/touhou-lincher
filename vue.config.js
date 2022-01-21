module.exports = {
    pluginOptions: {
        quasar: {
            importStrategy: 'pascal',
            rtlSupport: false
        },
        electronBuilder: {
            preload: 'src/preload.ts',
        }
    },
    transpileDependencies: [
        'quasar'
    ]
}
