// Project
var project_DIR = "project/";
var theme_folder = "../content/themes/theme/";

// Variables
var bowerDirectory_DIR = project_DIR+"/vendors/bower_components";
var bowerrc_DIR = project_DIR+"/vendors/.bowerrc";
var bowerJson_DIR = project_DIR+"/vendors/bower.json";


// Include Gulp
var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglifyjs'),
	filter = require('gulp-filter'),
	order = require('gulp-order'),
	mainBowerFiles = require('main-bower-files'),
	cache = require('gulp-cache'),
	compass = require('compass-importer')
	spritesmith = require('gulp.spritesmith'),
	sass = require('gulp-sass'),
	watch = require('gulp-watch'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	webpack = require('webpack-stream'),
	cleanCSS = require('gulp-clean-css'),
	del          = require('del'),
    imageminJpegRecompress = require('imagemin-jpeg-recompress');


// Define default destination folder
var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        js: theme_folder+'/js/',
        css: theme_folder+'/css/',
        img: theme_folder+'/img/',
        fonts: theme_folder+'/fonts/',
        stylesCss: theme_folder
    },
    src: { //Пути откуда брать исходники

        jsOtherVendors: project_DIR+"vendors/other-libs/**/*.+(css|js)", // библиотеки которые нет в bower, но мы хотим их использовать
        otherMixins: project_DIR+"vendors/other-mixins/",
        //mainJsModules: project_DIR+"resources/**/!(app).js", // все модули корме app.js
        mainCssModules: project_DIR+"resources/modules/**/*.scss", // все модули
        adminCss: project_DIR+"resources/modules-admin/**/*.scss", // все модули
        app: project_DIR+"resources/app.js", // главный js файл
        appAdmin: project_DIR+"resources/admin-app.js", // главный js файл
        raw_css: project_DIR+"resources/raw/**/*.+(scss|css)", // старые простыни скриптов
        sprites: project_DIR+"resources/images/sprites/**/*.png", // спрайты иконок
        images: [project_DIR+"resources/images/**/*.*","!"+project_DIR+"resources/images/{sprites,sprites/**}"],
        baseCss: project_DIR+"resources/base.scss",
        baseCssAdmin: project_DIR+"resources/admin-base.scss",
        layoutsCss: project_DIR+"resources/**/*layout*.scss",
        themesCss: project_DIR+"resources/themes/**/*.scss",
        fonts: project_DIR+'resources/fonts/**/*.*',
        fontsCss: project_DIR+'resources/fonts/**/styles.css',
        //vendorCss: theme_folder+"/vendor.css",
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        fonts: project_DIR+'resources/fonts/**/*.*',
        sprites: project_DIR+"resources/images/sprites/**/*.png",
        vendors: [project_DIR+"vendors/other-libs/**/*.+(css|js)",project_DIR+"vendors/**/.bower.json"],
        js: project_DIR+"resources/**/*.js",
        css: [project_DIR+"vendors/other-mixins/**/*.*",project_DIR+"resources/**/*.+(scss|css)",project_DIR+'resources/fonts/**/styles.css'],
        img: [project_DIR+"resources/images/**/*.*","!"+project_DIR+"resources/images/{sprites,sprites/**}"]
    }
};


gulp.task('fonts', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});



gulp.task('sprite', function() {
    var spriteData = 
        gulp.src(path.src.sprites) // путь, откуда берем картинки для спрайта
        .pipe(imagemin([
            pngquant()

            ],
            {
                verbose:true
            }
            ))
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: '_sprite.scss',
                imgPath:'img/sprite.png',
                cssFormat: "scss"
            }));

    spriteData.img.pipe(gulp.dest(path.build.img)); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest(path.src.otherMixins)); // путь, куда сохраняем стили
});


// компилируем библитеки и стили из bower
gulp.task('vendors', function() {

	var vendors = mainBowerFiles({
		paths: {
			bowerDirectory: bowerDirectory_DIR,
			bowerrc: bowerrc_DIR,
			bowerJson: bowerJson_DIR
		}
	});

	vendors.push(path.src.jsOtherVendors);

	var jsFilter = filter('**/*.js',{restore: true});  //отбираем только  javascript файлы
    var cssFilter = filter('**/*.css',{restore: true});  //отбираем только css файлы


	return gulp.src(vendors)
	.pipe(jsFilter)
	.pipe(concat('vendors.js'))
    .pipe(uglify({
        comments: false
    }))
	.pipe(gulp.dest(path.build.js))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe(concat('vendors.css'))
	.pipe(cleanCSS({
		keepSpecialComments :0
	}))
    .pipe(gulp.dest(path.build.css));
});

/*
gulp.task("js",function(){
	var js = gulp.src([path.src.mainJsModules,path.src.app,path.src.raw_js])
	.pipe(order([
		path.src.mainJsModules,
		path.src.app,
		path.src.raw_js
		],{ base: './' }))
	.pipe(concat('main.js'))
	.pipe(uglify())
	.pipe(gulp.dest(path.build.js));	

});
*/

gulp.task('js', function() {
  return gulp.src(path.src.app)
    .pipe(webpack({
    	output: {
    		filename: "main.js"
    	}
    }))
    .on('error', function handleError() {
      this.emit('end'); // Recover from errors
    })
    .pipe(uglify({
        comments: false
    }))
    .pipe(gulp.dest(path.build.js));
});

gulp.task('admin-js', function() {
  return gulp.src(path.src.appAdmin)
    .pipe(webpack({
    	output: {
    		filename: "wp-admin.js"
    	}
    }))
    .on('error', function handleError() {
      this.emit('end'); // Recover from errors
    })
    .pipe(uglify({
        comments: false
    }))
    .pipe(gulp.dest(path.build.js));
});





gulp.task('css', function() {

    // все кроме base, layout и themes
    var css = gulp.src([
        //path.src.vendorCss,
        path.src.raw_css,
        path.src.baseCss,
        path.src.fontsCss,
        path.src.layoutsCss,
        path.src.mainCssModules,
        path.src.themesCss])
    .pipe(order([
        //path.src.vendorCss,
        path.src.baseCss,
        path.src.fontsCss,
        path.src.raw_css,
        path.src.layoutsCss,
        path.src.mainCssModules,
        path.src.themesCss],{ base: './' }))
    .pipe(concat('style.scss'))
    .pipe(sass({importer: compass, includePaths: [path.src.otherMixins],outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(cleanCSS({
        keepSpecialComments :0
    }))
    .pipe(gulp.dest(path.build.stylesCss));

    //del.sync(path.src.vendorCss);
});



gulp.task('css-admin', function() {
	// все кроме base, layout и themes
	var css = gulp.src([
        path.src.baseCssAdmin,
		path.src.adminCss,
		])
    .pipe(order([
        //path.src.vendorCss,
        path.src.baseCssAdmin,
        path.src.adminCss],{ base: './' }))
	.pipe(concat('admin.scss'))
	.pipe(sass({importer: compass, includePaths: [path.src.otherMixins],outputStyle: 'expanded' }).on('error', sass.logError))
	.pipe(cleanCSS({
		keepSpecialComments :0
	}))
	.pipe(gulp.dest(path.build.css));
});




gulp.task('img', function() {
    return gulp.src(path.src.images) // Берем все изображения из app
        .pipe(imagemin([
            pngquant(),
            imageminJpegRecompress({
                loops:4,
                min: 50,
                max: 95,
                quality:'high' 
            }),

            ],
            {
                verbose:true
            }
        ))
        .pipe(gulp.dest(path.build.img)); // Выгружаем на продакшен
});


gulp.task('build', [
    'fonts',
    'sprite',
    'vendors',
    'css',
    'css-admin',
    'js',
    'admin-js',
    'img'
]);


gulp.task('watch', function() {
	watch(path.watch.fonts, function(event, cb) {
		gulp.start('fonts');
	});

	watch(path.watch.sprites, function(event, cb) {
		gulp.start('sprite');
	});

	watch(path.watch.vendors, function(event, cb) {
		gulp.start('vendors');
	});

	watch(path.watch.js, function(event, cb) {
		gulp.start('js',"admin-js");
	});

    watch(path.watch.css, function(event, cb) {
        gulp.start('css','css-admin');
    });

	watch(path.watch.img, function(event, cb) {
		gulp.start('img');
	});


});

gulp.task('default', ['watch']);

gulp.task('clear', function () {
    return cache.clearAll();
});

