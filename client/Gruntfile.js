module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

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
        }


    });

    grunt.registerTask('docs', ['jsdoc'])
    grunt.registerTask('default', 'docs');
};
