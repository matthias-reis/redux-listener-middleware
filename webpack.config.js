module.exports = {
  module: {
    loaders: [
      { test: /\\.js$/, loader: 'babel', exclude: [ 'node_modules' ] }
    ]
  },
  resolve: {
    extensions: [ '', 'js' ],
    modulesDirectories: [ 'node_modules' ],
    root: '.'
  }
};
