var ctx = {};

module.exports = {
  all: function () {
    return ctx;
  },
  get: function (name) {
    if (ctx.hasOwnProperty(name)) {
      return ctx[name];
    }

    return null;
  },
  set: function (name, value) {
    ctx[name] = value;
  }
};