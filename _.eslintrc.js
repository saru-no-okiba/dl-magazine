module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    "plugin:vuejs-accessibility/recommended"
  ],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  plugins: ['vuejs-accessibility'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vuejs-accessibility/label-has-for': [
      "off"
    ],
    'form-control-has-label':[
      "off"
    ]
  }
}
