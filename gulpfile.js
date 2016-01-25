/**
 *  Build script
 *
 *  @version 1.0.0
 *  @author Dumitru Uzun (DUzun.Me)
 */

var fs              = require('fs');
var path            = require('path');
var gulp            = require('gulp');
var $               = require('gulp-load-plugins')();
var minimist        = require('minimist');
var streamqueue     = require('streamqueue');
var closureCompiler = require('google-closure-compiler').gulp();
var runSequence     = require('run-sequence');


gulp.task('default', function () {
    return runSequence('transpile', 'bundle');
});


gulp.task('transpile', function () {
    return gulp.src('src/*.js', { base: 'src/' })
    .pipe($.babel({
        presets: ['es2015'],
        compact: false,
    }))
    .pipe(gulp.dest('dist'))
    ;
})

gulp.task('bundle', function () {
    var stream = streamqueue({ objectMode: true });

    var s = gulp.src('dist/hashSync.jquery.js', { base: 'dist/' })
    .pipe($.rollup({
        format: 'umd',
        moduleName: 'HashSync',
        globals: {
            jQuery: 'jQuery',
            location: 'location',
        },
    }))
    .pipe($.rename('hashSync.jquery.umd.js'))
    ;
    stream.queue(s);

    var c = s
    .pipe($.clone())
    // .pipe($.rename({ extname: '.min.js' }))
    .pipe(closureCompiler({
        compilation_level: "SIMPLE_OPTIMIZATIONS",
        language_in: "ECMASCRIPT6",
        language_out: "ECMASCRIPT3",
        warning_level: 'DEFAULT', // QUIET | DEFAULT | VERBOSE
          // js_output_file: destFn, // if missing, stdout is used
          // output_wrapper: '(function(window, chrome){%output%})(this, chrome);',
    }))
    .pipe($.rename('hashSync.jquery.min.js')) // when there is no js_output_file option, we need a filename
    ;

    stream.queue(c);

    return stream.done().pipe(gulp.dest('dist'));    
});

