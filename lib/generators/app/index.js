'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');

var KarmaGenerator = module.exports = function KarmaGenerator(args, options) {
  yeoman.generators.Base.apply(this, arguments);
  this.sourceRoot(path.join(__dirname, '../../', 'templates'));
  
  this.framework = options['framework'] || 'ANGULAR';
  this.framework = this.framework.toUpperCase();
  
  if(this.framework == 'EMBER'){
    this.testFramework = options['test-framework'] || 'QUNIT';  
  }else{
    this.testFramework = options['test-framework'] || 'JASMINE'; 
  }
  
  this.testFramework = this.testFramework.toUpperCase();

  if (options.coffee) {
    this.format = 'coffee';
  } else {
    this.format = 'js';
  }
  
  this.components = options.components;
  
  // Provide the default components from prior releases for backwards compat.
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
      
      if(this.testFramework == 'MOCHA'){
        this.components.push(
          'ember-mocha-adapter/adapter.js'
        );  
      }
    }
  }
  
  this.skipInstall = options['skip-install'];

  this.on('end', function () {
    if (!this.skipInstall) {
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
    this.scripts = [
      '.tmp/scripts/combined-scripts.js',
      '.tmp/scripts/compiled-templates.js',
      this.testPath + '/support/*.', + this.format,
      this.testPath + '/spec/*.' + this.format, 
      this.testPath + '/integration/*.' + this.format 
    ];
    
    if(this.testFramework == 'MOCHA'){
        this.components.push(
          this.testPath + '/lib/chai.js'
        );  
      }
  }
  
  this.template('karma.conf.js', 'karma.conf.js');
  if(this.framework !== 'EMBER'){
    this.template('karma-e2e.conf.js', 'karma-e2e.conf.js');
  }
};

KarmaGenerator.prototype.packageFile = function packageFile() {
  if (!this.skipInstall) {
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
