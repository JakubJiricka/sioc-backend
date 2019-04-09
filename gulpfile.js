const gulp = require('gulp');
const plugins = require('gulp-load-plugins');
const $ = plugins();

gulp.task('eslint', () =>
    gulp.src(['**/*.js', '!node_modules/**', '!coverage/**', '!dist/**'])
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError())
);

gulp.task('mocha', () =>
    gulp.src('src/**/*.js')
        .pipe($.istanbul())
        .on('finish',
            () => gulp.src('test/**/*.test.js')
                .pipe($.mocha({reporter: 'spec'}))
                .pipe($.istanbul.writeReports())
                .on('error', process.exit.bind(process, 1))
                .on('end', process.exit.bind(process))
        )
);

gulp.task('server', () => $.nodemon({
    script: './',
    env: {NODE_ENV: process.env.NODE_ENV || 'development'},
    ignore: ['./test/**/*.js'],
    nodeArgs: ['--debug']
}));

gulp.task('clean:dist', () => require('del')('dist'));

gulp.task('copy:dist', () =>
    gulp
        .src([
            'index.js',
            './config/**',
            './src/**'
        ], {base: '.'})
        .pipe(gulp.dest('dist'))
);

gulp.task('package', () =>
    gulp.src('./package.json')
        .pipe($.jsonEditor(json => {
            delete json.devDependencies;
            return json;
        }, {end_with_newline: true}))
        .pipe(gulp.dest('dist/'))
);

gulp.task('dist', () =>
    gulp.run(['copy:dist', 'package'])
);

gulp.task('build', ['clean:dist'], () =>
    gulp.run(['dist'])
);

gulp.task('build:uat', ['clean:dist'], () =>
    gulp.run(['dist'])
);

gulp.task('test', ['eslint']);
gulp.task('dev', ['server']);
