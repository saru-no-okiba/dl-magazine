const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  outputDir: '../dist/dl-magazine',

  //ファイル名にハッシュ値をつけない
  filenameHashing: false,

  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      //チャンクファイルを生成しないようにする
      config.optimization.delete('splitChunks')
    }
  }
})
