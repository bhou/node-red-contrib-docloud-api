/**
 * Created by B.HOU on 6/3/2015.
 */

var context = require('./context');

module.exports = function (options, imports, register) {
  context.set('docloud', imports.docloud);
  context.set('eventbus', imports.eventbus);

  register();
};