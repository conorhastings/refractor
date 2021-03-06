'use strict';

/* global window */

var restore = capture();

/* istanbul ignore next - Don't allow Prism to run on page load in browser. */
var ctx = typeof window === 'undefined' ? {} : window;

ctx.Prism = {manual: true};

/* Load all stuff in `prism.js` itself, except for
 * `prism-file-highlight.js`.
 * The wrapped non-leaky grammars are loaded instead of
 * Prism’s originals. */
var h = require('hastscript');
var Prism = require('prismjs/components/prism-core');
var markup = require('./lang/markup');
var css = require('./lang/css');
var clike = require('./lang/clike');
var js = require('./lang/javascript');

restore();

var own = {}.hasOwnProperty;

/* Inherit. */
function Refractor() {}

Refractor.prototype = Prism;

/* Construct. */
var refract = new Refractor();

/* Expose. */
module.exports = refract;

/* Create. */
refract.highlight = highlight;
refract.register = register;
refract.syntax = syntax;

/* Register bundled grammars. */
register(markup);
register(css);
register(clike);
register(js);

refract.util.encode = encode;
refract.Token.stringify = stringify;

function register(grammar) {
  if (typeof grammar !== 'function' || !grammar.displayName) {
    throw new Error('Expected `function` for `grammar`, got `' + grammar + '`');
  }
  /* Do not duplicate registrations. */
  if (refract.languages[grammar.displayName] === undefined) {
    grammar(refract);
  }
}

function highlight(value, name, language) {
  var sup = Prism.highlight;
  var syntax;

  if (typeof value !== 'string') {
    throw new Error('Expected `string` for `value`, got `' + value + '`');
  }

  if (typeof name !== 'string') {
    throw new Error('Expected `string` for `name`, got `' + name + '`');
  }

  if (!own.call(refract.languages, name)) {
    throw new Error('Unknown language: `' + name + '` is not registered');
  }

  syntax = refract.languages[name];

  return sup.call(this, value, syntax, language);
}

function syntax(language) {
  if (typeof language !== 'string') {
    throw new Error('Expected `string` for `language`, got `' + language + '`');
  }
  if (refract.languages[language]) {
    return refract.languages[language];
  }
}

function stringify(value, language, parent) {
  var env;

  if (typeof value === 'string') {
    return {type: 'text', value: value};
  }

  if (refract.util.type(value) === 'Array') {
    return stringifyAll(value, language);
  }

  env = {
    type: value.type,
    content: refract.Token.stringify(value.content, language, parent),
    tag: 'span',
    classes: ['token', value.type],
    attributes: {},
    language: language,
    parent: parent
  };

  if (value.alias) {
    env.classes = env.classes.concat(value.alias);
  }

  refract.hooks.run('wrap', env);

  return h(
    env.tag + '.' + env.classes.join('.'),
    env.attributes,
    env.content
  );
}

function stringifyAll(values, language) {
  var result = [];
  var length = values.length;
  var index = -1;
  var value;

  while (++index < length) {
    value = values[index];

    if (value !== '' && value !== null && value !== undefined) {
      result.push(value);
    }
  }

  index = -1;
  length = result.length;

  while (++index < length) {
    value = result[index];
    result[index] = refract.Token.stringify(value, language, result);
  }

  return result;
}

function encode(tokens) {
  return tokens;
}

function capture() {
  var defined = 'Prism' in global;
  /* istanbul ignore next */
  var current = defined ? global.Prism : undefined;

  return restore;

  function restore() {
    /* istanbul ignore else - Clean leaks after Prism. */
    if (defined) {
      global.Prism = current;
    } else {
      delete global.Prism;
    }

    defined = undefined;
    current = undefined;
  }
}
