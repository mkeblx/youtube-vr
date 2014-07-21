module.exports = function(grunt) {

	var _time = Math.round(new Date().getTime() / 1000);

	//require('time-grunt')(grunt);

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		dir: {
			libs: 'js/libs/'
		},

		concat: {
			options: {
				nonull: true,
				separator: '\n;\n',
				stripBanners: true,
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:MM") %> */\n'
			},
			libs: {
				src: [
					'<%= dir.libs %>lodash.min.js',
					'<%= dir.libs %>jquery.min.js',
					'<%= dir.libs %>tween.min.js',
					'<%= dir.libs %>three.min.js'
					],
				dest: '<%= dir.libs %>combined.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd hh:MM") %> */\n',
				beautify: {
					width: 0,
					beautify: false
				}
			},
			build: {
				src: 'js/libs/combined.js',
				dest: 'js/libs/combined.min.js'
			}
		},
		jshint: {
			jshintrc: '.jshintrc',
			files: {
				src: ['js/*.js']
			}
		},
		watch: {
			options: {
				livereload: true
			}
		}
	});

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	grunt.registerTask('default', ['concat:libs','uglify']);
	grunt.registerTask('compile' , ['requirejs']);

};
