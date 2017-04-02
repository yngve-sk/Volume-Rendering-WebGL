module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    var srcFiles = [
    'src/twgl.js',
    'src/attributes.js',
    'src/draw.js',
    'src/framebuffers.js',
    'src/programs.js',
    'src/textures.js',
    'src/typedarrays.js',
    'src/vertex-arrays.js',
  ];

    var thirdPartyFiles = [
  ];

    var extraFiles = [
    'src/v3.js',
    'src/m4.js',
    'src/primitives.js',
  ];

    var docsFiles = srcFiles.concat(extraFiles, 'README.md');
    var libFiles = srcFiles.concat(thirdPartyFiles);
    var fullLibFiles = [].concat(srcFiles, extraFiles, thirdPartyFiles);

    grunt.initConfig({
        jsdoc: {
            dist: {
                //src: ['src/*.js'],
                options: {
                    destination: 'docs',
                    configure: 'conf.json',
                    recurse: true,
                }
            }
        },
        watch: {
            options: {
                interval: 100
            },
            js: {
                files: ['src/**/*.js'],
                tasks: [
                    /*'jsdoc:dist', */
                    'browserify:dist'
                ]
            }
        },
        browserify: {
            dist: {
                files: {
                    'build/main-compiled.js': ['src/main.js']
                },
                options: {
                    transform: ['glslify']
                }
            }
        },
        uglify: {
            my_target: {
                options: {
                    mangle: false,
                    compress: false

                },
                files: {
                    'build/externals.min.js': [
                        'node_modules/jquery/dist/jquery.min.js',
                        'node_modules/angular/angular.min.js',
                        'node_modules/angularjs-slider/dist/rzslider.js',
                        'semantic/dist/semantic.min.js',
                        'node_modules/jquery-resizable-dom/dist/jquery-resizable.js',
                        'node_modules/semantic-ui-angular-jquery/angular-semantic-ui.min.js'
                    ]
                }
            }
        },
        cssmin: {
            options: {
                mergeIntoShorthands: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'build/style.css': [
                        'css/all.css',
                        'semantic/dist/semantic.min.css',
                        'node_modules/spectrum-colorpicker/spectrum.css',
                        'node_modules/angularjs-slider/dist/rzslider.min.css'
                        ]
                }
            }
        }



    });

    grunt.registerTask('docs', ['jsdoc'])
    grunt.registerTask('default', 'docs');
};
