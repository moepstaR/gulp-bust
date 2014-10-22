# [gulp](https://github.com/wearefractal/gulp)-bust [![NPM version](http://img.shields.io/npm/v/gulp-bust.svg)](https://www.npmjs.org/package/gulp-bust) [![Build status](http://img.shields.io/travis/mattyod/gulp-bust.svg)](http://travis-ci.org/mattyod/gulp-bust)

> Gulp cache busting with development or production mappings

## Installation

```
npm install gulp-bust
```

## Usage

```
var gulp = require('gulp'),
    Bust = require('gulp-bust');

var bust = new Bust();

gulp.task('assets', function () {
  return gulp.src(['src/img/*.png', 'src/css/*.css', 'src/js/*.js'])
    .pipe(bust.resources())
    .pipe(gulp.dest('dist/public'));
});

gulp.task('templates', function () {
  return gulp.src('src/templates/*')
    .pipe(bust.references())
    .pipe(gulp.dest('views'));
});
```

## Initialisation

```
var bust = new Bust([options]);
```

Options can be set on initialisation or at a later point by dirrectly updating the settings hash.

```
bust.settings.production = false;
```

### Options

> #### hashLength _(number)_

**default:** _false_

Numerical value if you wish to shorten your checksum length. e.g.

```
new Bust({ hashLength: 12 });
```

Will cut checksum hashes down to 12 characters.

> #### hashType _(string)_

> **default** _'md5'_

Any [Node crypto hash type](http://nodejs.org/api/crypto.html#crypto_crypto_gethashes). e.g.

```
new Bust({ hashType: 'sha1' });
```

> #### production _(boolean)_

> **default** _true_

Boolean flag to set/unset production mode.

When set to false Bust will not add checksum hashes to files but will generate a [mappings object](#the-mappings-object).

## Resources

```
bust.resources()
```

Renames and maps to resources as they pass through. Checksums are generated against file contents so will only change if the file contents change. So a file such as: ```foo.png``` might become: ```foo.3858f62230ac3c915f300c664312c63f.png```. All file references will also be recorded on the [mappings object](#the-mappings-object).

## References

```
bust.references()
```

Updates file content such as your templates to refer to files previously renamed by bust.resources(). A template such as:

```
html
  head
    link(href='/public/css/style.css', rel='stylesheet')
  body
```

might become:

```
html
  head
    link(href='/public/css/style.3858f62230ac3c915f300c664312c63f.css', rel='stylesheet')
  body
```

## The mappings object

The mappings object can be accessed via bust.mappings and can be useful for referring to dynamically rendered content within templates.

By default when the production flag in settings is set to true the mappings object will look something like:

```
{
  "foo.png": "foo.3858f62230ac3c915f300c664312c63f.png",
  "bar.css": "bar.6754fsd205aasd944d523sd4so40i98d.css"
}
```

If the production flag is set to false the mappings object will look something like:

```
{
  "foo.png": "foo.png",
  "bar.css": "bar.css"
}
```

## Licence

[MIT](https://raw.github.com/mattyod/gulp-bust/master/LICENSE)
