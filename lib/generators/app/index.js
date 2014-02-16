'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');

var KarmaGenerator = module.exports = function KarmaGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);
  this.sourceRoot(path.join(__dirname, '../../', 'templates'));
  this.testFramework = options['test-framework'] || 'JASMINE';
  this.testFramework = this.testFramework.toUpperCase();
  
  this.framework = options['framework'] || 'ANGULAR';
  this.framework = this.framework.toUpperCase();

  if (options.coffee) {
    this.format = 'coffee';
  } else {
    this.format = 'js';
  }
  
  // Provide the default components from prior releases for backwards compat.
  this.components = options.components;
  
  if(this.components == null){
    if(this.framework == 'ANGULAR'){
      this.components = [
        'angular/angular.js',
        'angular/angular-mocks.js'
      ];  
    }else if(this.framework == 'EMBER'){
      this.components = [
        'jquery/jquery.min.js',
        'handlebars/handlebars.runtime.js',
        'ember/ember.js',
        'ember-data/ember-data.js'
      ];  
    }
  }

  this.save = true;
  if (options['skip-save']) {
    this.save = false;
  }

  this.on('end', function () {
    if (!options['skip-install']) {
      this.npmInstall(['grunt-karma', 'karma-ng-html2js-preprocessor', 'karma-ng-scenario'], {
        saveDev: true
      });
    }
  });
};

util.inherits(KarmaGenerator, yeoman.generators.Base);

KarmaGenerator.prototype.setupEnv = function setupEnv() {

  this.testPath = this.options.testPath ? this.options.testPath : 'test';
  
  this.scripts = [
    'app/scripts/*.' + this.format,
    'app/scripts/**/*.' + this.format,
    this.testPath + '/mock/**/*.' + this.format,
    this.testPath + '/spec/**/*.' + this.format 
  ];
  
  if(this.framework == 'EMBER'){
    
  }
  
  this.template('karma.conf.js', 'karma.conf.js');
  if(this.framework !== 'EMBER'){
    this.template('karma-e2e.conf.js', 'karma-e2e.conf.js');
  }
};

KarmaGenerator.prototype.bower = function bower() {
  if (this.save) {
    //Note: Look into this.template
    this.copy('bowerrc', '.bowerrc');
    this.copy('_bower.json', 'bower.json');
  }
};

KarmaGenerator.prototype.packageFile = function packageFile() {
  if (this.save) {
    this.copy('_package.json', 'package.json');
  }
};

KarmaGenerator.prototype.setupTravis = function setupTravis() {
  if (!this.options.travis) {
    return;
  }

  var done = this.async();
  var cwd = this.options.cwd || process.cwd();
  var packageJson = path.join(cwd, 'package.json');

  this.copy('travis.yml', '.travis.yml');

  // Rewrite the package.json to include a test script unless it's already
  // specified.
  fs.readFile(packageJson, { encoding: 'utf-8' }, function (err, content) {
    var data;
    if (err) {
      this.log.error('Could not open package.json for reading.', err);
      done();
      return;
    }

    try {
      data = JSON.parse(content);
    } catch (err) {
      this.log.error('Could not parse package.json.', err);
      done();
      return;
    }

    if (data.scripts && data.scripts.test) {
      this.log.writeln('Test script already present in package.json. ' +
                       'Skipping rewriting.');
      done();
      return;
    }

    data.scripts = data.scripts || {};
    data.scripts.test = 'grunt test';


    fs.writeFile(packageJson, JSON.stringify(data, null, 2), done);
  }.bind(this));
};
