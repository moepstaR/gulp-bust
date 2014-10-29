'use strict';

var through = require('through2'),
    Bust = require('../index.js'),
    os = require('os'),
    bust;

describe('gulp-bust', sandbox(function () {

  describe('intialising', function () {
    var options;

    beforeEach(function () {
      options = {
        hashLength: 4,
        hashType: 'sha1',
        production: false,
        foo: 'bar'
      };

      sandbox.stub(os, 'platform').returns('darwin');

      bust = new Bust(options);
    });

    it('creates an instance of Bust', function () {
      bust.should.be.an.instanceOf(Bust);
    });

    it('creates a mappings object', function () {
      bust.mappings.should.deep.equal({});
    });

    it('sets local settings', function () {
      bust.settings.should.deep.equal(options);
    });

    it('sets OS flag', function () {
      bust.isWin.should.equal(false);
    });

  });

  describe('funnel', function () {
    var callback,
        file = {};

    beforeEach(function () {
      callback = sandbox.stub();

      Bust.prototype.method = sandbox.stub();

      bust = new Bust();

      file.isNull = sandbox.stub().returns(false);
      file.isStream = sandbox.stub().returns(false);
      file.isBuffer = sandbox.stub().returns(true);
      bust.push = sandbox.stub();

      bust.funnel(file, 'utf8', callback);
    });

    it('checks if file isNull', function () {
      file.isNull.should.have.been.calledOnce;
    });

    it('checks if file isStream', function () {
      file.isStream.should.have.been.calledOnce;
    });

    it('checks if file isBuffer', function () {
      file.isStream.should.have.been.calledOnce;
    });

    it('passes the file through the prototypes method', function () {
      Bust.prototype.method.should.have.been.calledWithExactly(file);
    });

    it('pushes the file into scope', function () {
      bust.push.should.have.been.calledWithExactly(file);
    });

    it('finishes up with the callback', function () {
      callback.should.have.been.calledOnce;
    });

  });

  describe('rename', function () {
    var path;

    describe('vanilla', function () {

      beforeEach(function () {
        bust = new Bust();

        path = bust.rename('/img/foo.bar.png', '1234');
      });

      it('inserts the hash into the file name', function () {
        path.should.equal('/img/foo.bar.1234.png');
      });

    });

    describe('with a hash length set', function () {

      beforeEach(function () {
        bust = new Bust({
          hashLength: 2
        });

        path = bust.rename('/img/foo.bar.png', '1234');
      });

      it('inserts the shortened hash into the file name', function () {
        path.should.equal('/img/foo.bar.12.png');
      });

    });

  });

  describe('sanitise', function () {
    var path = 'foo\\bar\\foo\\bar',
        expected = 'foo/bar/foo/bar',
        result;

    beforeEach(function () {
      bust = new Bust();
    });

    describe('for windows', function () {

      beforeEach(function () {
        bust.isWin = true;
        result = bust.sanitise(path);
      });

      it('returns a web path', function () {
        result.should.equal(expected);
      });

    });

    describe('for others', function () {

      beforeEach(function () {
        bust.isWin = false;
        result = bust.sanitise(path);
      });

      it('returns the given path', function () {
        result.should.equal(path);
      });

    });

  });

  describe('res', function () {

    describe('for development', function () {
      var file = {
        relative: '/foo/bar.png'
      };

      beforeEach(function () {
        bust = new Bust({
          production: false
        });

        bust.res(file);
      });

      it('maps the relative file path to mappings hash', function () {
        bust.mappings[file.relative] = file.relative;
      });

    });

    describe('for production', function () {
      var fullPath = '/blah/foo/bar.png',
          originalRelPath = '/foo/bar.png',
          newRelPath = '/foo/bar.123.png';

      beforeEach(function () {
        var file = {
          relative: originalRelPath,
          path: fullPath,
          contents: new Buffer('foobar')
        };

        bust = new Bust();
        sandbox.stub(bust, 'rename', function () {
          file.relative = newRelPath;
          return 'foo';
        });

        bust.res(file);
      });

      it('calls rename with file path and checksum of file contents', function () {
        bust.rename.should.have.been.calledWith(fullPath, '3858f62230ac3c915f300c664312c63f');
      });

      it('maps the relative file path to mappings hash', function () {
        bust.mappings[originalRelPath].should.equal(newRelPath);
      });

    });

  });

  describe('createRegExp', function () {

    beforeEach(function () {
      bust = new Bust();

      bust.mappings = {
        foo: 1,
        bar: 1,
        baz: 1
      };

      bust.createRegExp();
    });

    it('creates a regexp from the mapping keys', function () {
      bust.regExp.should.be.an.instanceOf(RegExp);
    });

    it('references each key (file name) within the regexp', function () {
      bust.regExp.toString().should.equal('/foo|bar|baz/g');
    });

  });

  describe('ref', function () {
    var file;

    beforeEach(function () {
      bust = new Bust();

      file = {
        contents: new Buffer('foo foo.png and bar.gif then baz.pdf')
      };

      bust.regExp = new RegExp('foo.png|bar.gif|baz.pdf', 'g');

      bust.mappings = {
        'foo.png': 'foo.123.png',
        'bar.gif': 'bar.123.gif',
        'baz.pdf': 'baz.123.pdf'
      };

      bust.ref(file);
    });

    it('Swaps in the mappings values onto the ', function () {
      file.contents.toString()
        .should.equal('foo foo.123.png and bar.123.gif then baz.123.pdf');
    });

  });

  describe('resources', function () {
    var ret;

    beforeEach(function () {
      bust = new Bust();
      sandbox.stub(through, 'obj').returns('foo');

      ret = bust.resources();
    });

    it('sets method as res', function () {
      bust.method.toString().should.equal(bust.res.toString());
    });

    it('pipes through the funnel method', function () {
      through.obj.should.have.been.calledWith(bust.funnel);
      ret.should.equal('foo');
    });

  });

  describe('references', function () {
    var ret;

    beforeEach(function () {
      sandbox.stub(Bust.prototype, 'createRegExp');
      bust = new Bust();
      sandbox.stub(through, 'obj').returns('foo');

      ret = bust.references();
    });

    it('generates the regular expression', function () {
      Bust.prototype.createRegExp.should.have.been.calledOnce;
    });

    it('sets method as req', function () {
      bust.method.toString().should.equal(bust.ref.toString());
    });

    it('pipes through the funnel method', function () {
      through.obj.should.have.been.calledWith(bust.funnel);
      ret.should.equal('foo');
    });

  });

}));
