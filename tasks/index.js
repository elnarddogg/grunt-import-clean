module.exports = function( grunt ) {

  'use strict';
  

  var util = require( 'util' );
  var fs = require( 'fs-extra' );
  var colors = require( 'colors' );
  var lib = require( './lib' );
  var shared = lib.shared;
  var comment = lib.comment;
  var imports = lib.imports;
  var aggregate = lib.aggregate;
  var print = lib.print;
  var TestAdaptor = lib.TestAdaptor;

  var pkg = fs.readJsonSync( './package.json' );

  grunt.registerMultiTask( 'import-clean' , pkg.description , function() {

    var that = this;
    var options = that.options();
    var data = shared.ensureArray( that.data );
    var testAdaptor = options.test ? new TestAdaptor( __dirname ) : testAdaptor;
    var force = options.force !== undefined ? options.force : true;

    var files = data.reduce(function( prev , current ) {
      return prev.concat(
        grunt.file.expand( current )
      );
    }, []);

    util.print(
      'Validating imports in ' +
      files.length + ' files... '
    );

    files = files.map(function( src ) {
      return {
        src: src,
        input: comment(
          fs.readFileSync( src , 'utf-8' )
        )
      };
    })
    .map(function( file ) {
      file = imports( file );
      file.unused = file.imports.filter(function( name ) {
        name = shared.escRegExp( name );
        var re = new RegExp( '(^|\\W)' + name + '(\\W?|$)' );
        return !re.test( file.input );
      });
      return file;
    });

    var result = aggregate( files );
    var msg;

    if (options.test) {
      testAdaptor.write( that.target , result );
      msg = '\ntest output written to tmp/' + that.target + '.json';
      util.puts( msg.yellow );
    }
    else if (result.foundFiles) {

      print( result.unused );

      msg = 'found ' + result.foundImports +
        ' unused imports in ' + result.foundFiles +
        ' file' + (result.foundFiles > 1 ? 's' : '') + '.';

      // grunt.option( 'force' , true ) will force all subsequent tasks.
      // this handles the force option politely.
      if (force) {
        util.puts(( 'Warning: ' + msg ).yellow );
      }
      else {
        grunt.fail.warn( msg );
      }
    }
    else {
      util.puts( '\u2713 OK'.green );
    }
    
  });

};



















