module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        'plugin:vue/vue3-essential',
        '@vue/standard',
        '@vue/typescript/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'semi': ['error', 'always'],
        'indent': ['error', 4],
        "space-before-function-paren": ['error', 'never']
    },
    globals: {
        'invokeInMain': 'readonly',
        'defineProps': 'readonly',
        'defineEmits': 'readonly',
        'withDefaults': 'readonly',
        'onIpcMessage': 'readonly',
        'sendIpcMessage': 'readonly'
    },
}