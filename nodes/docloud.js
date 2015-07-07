var fs = require('fs');

var context = require('../context');

var DEFAULT_CONFIG_CHANGE_EVENT = 'fx-red-docloud.defaultConfig.changed';
var JOB_CREATED_EVENT = 'fx-red-docloud.job.created';
var JOB_PROCESSED_EVENT = 'fx-red-docloud.job.processed';
var JOB_INTERRUPTED_EVENT = 'fx-red-docloud.job.interrupted';
var JOB_FAILED_EVENT = 'fx-red-docloud.job.failed';
var JOB_ERROR_EVENT = 'fx-red-docloud.job.error';

if (!context.get('docloud')) {
  // use architect to load the plugins
  var path = require('path');
  var architect = require("architect");

  var config = [
    '../node_modules/fx-config',
    '../node_modules/fx-eventbus',
    '../node_modules/fx-docloud-api'
  ];
  var tree = architect.resolveConfig(config, __dirname);
  var runtime = architect.createApp(tree, function (err, app) {
    if (err) throw err;
  });

  context = runtime;
  context.get = runtime.getService;
}

module.exports = function (RED) {
  function DocloudDefaultConfigNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    this.conf = RED.nodes.getNode(config.conf);

    // call global variable runtime to get the service instance
    var docloud = context.get('docloud');
    var eventbus = context.get('eventbus');

    docloud.setDefault(this.conf);

    eventbus.emit(DEFAULT_CONFIG_CHANGE_EVENT, this.conf);

    this.on('close', function () {
      docloud.setDefault(null);
    });
  }

  RED.nodes.registerType('docloud default config', DocloudDefaultConfigNode);


  function DocloudExecuteNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    var docloud = context.get('docloud');
    var eventbus = context.get('eventbus');

    function changeStatus() {
      node.conf = RED.nodes.getNode(config.conf);
      // setup status
      var clientName = node.conf ? node.conf.toString() : null;
      if (!clientName && docloud.getDefault()) {
        if (typeof docloud.getDefault().toString === 'function') {
          clientName = docloud.getDefault().toString();
        } else {
          clientName = docloud.getDefault().url ? docloud.getDefault().url + ':******' : null;
        }
      }

      if (clientName) {
        node.status({
          fill: "green",
          shape: "dot",
          text: clientName
        });
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Undefined"
        });
      }

    }

    eventbus.on(DEFAULT_CONFIG_CHANGE_EVENT, function (msg) {
      changeStatus();
    });

    changeStatus();

    this.on('input', function (msg) {
      var op = config.operation;
      if (msg.operation) {
        op = msg.operation;
      }

      var client = docloud.client(node.conf);

      if (!msg.payload) {
        msg.payload = {};
      }
      var logstream = msg.payload.log ? fs.createWriteStream(msg.payload.log) : process.stdout;
      var timeLimit = msg.payload.timeLimit || 3 * 60 * 1000;
      var attachments = msg.payload.attachments;

      var attachmentsObj = [];
      for (var key in attachments) {
        if (attachments.hasOwnProperty(key)) {
          attachmentsObj.push({
            name: key,
            stream: fs.createReadStream(attachments[key])
          })
        }
      }

      if (op == 'execute') {
        client.execute({
          logstream: logstream,
          parameters: {"oaas.TIME_LIMIT": timeLimit},
          attachments: attachmentsObj
        }).on('created', function (jobid) {
          msg.payload = jobid;
          node.send(msg);
          eventbus.emit(JOB_CREATED_EVENT, msg);
        }).on('processed', function (jobid) {
          msg.payload = jobid;
          eventbus.emit(JOB_PROCESSED_EVENT, msg);
        }).on('interrupted', function (jobid) {
          msg.payload = jobid;
          eventbus.emit(JOB_INTERRUPTED_EVENT, msg);
        }).on('failed', function (jobid) {
          msg.payload = jobid;
          eventbus.emit(JOB_FAILED_EVENT, msg);
        }).on('error', function (error) {
          msg.payload = error;
          eventbus.emit(JOB_ERROR_EVENT, msg);
        });
      } else if (op == 'submit') {
        client.submit({
          logstream: logstream,
          parameters: {"oaas.TIME_LIMIT": timeLimit},
          attachments: attachmentsObj
        }).on('created', function (jobid) {
          msg.payload = jobid;
          node.send(msg);
          eventbus.emit(JOB_CREATED_EVENT, msg);
        }).on('error', function (error) {
          msg.payload = error;
          eventbus.emit(JOB_ERROR_EVENT, msg);
        });
      } else if (op == 'create') {
        client.submit({
          logstream: logstream,
          parameters: {"oaas.TIME_LIMIT": timeLimit},
          attachments: attachmentsObj
        }).on('created', function (jobid) {
          msg.payload = jobid;
          node.send(msg);
          eventbus.emit(JOB_CREATED_EVENT, msg);
        }).on('error', function (error) {
          msg.payload = error;
          eventbus.emit(JOB_ERROR_EVENT, msg);
        });
      }
    });
  }

  RED.nodes.registerType('docloud execute', DocloudExecuteNode);


  function DocloudJobNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    var docloud = context.get('docloud');
    var eventbus = context.get('eventbus');

    function changeStatus() {
      node.conf = RED.nodes.getNode(config.conf);
      // setup status
      var clientName = node.conf ? node.conf.toString() : null;
      if (!clientName && docloud.getDefault()) {
        if (typeof docloud.getDefault().toString === 'function') {
          clientName = docloud.getDefault().toString();
        } else {
          clientName = docloud.getDefault().url ? docloud.getDefault().url + ':******' : null;
        }
      }

      if (clientName) {
        node.status({
          fill: "green",
          shape: "dot",
          text: clientName
        });
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Undefined"
        });
      }

    }

    eventbus.on(DEFAULT_CONFIG_CHANGE_EVENT, function (msg) {
      changeStatus();
    });

    changeStatus();

    var client = docloud.client(node.conf);

    this.on('input', function(msg) {
      var op = config.operation;
      if (msg.operation) {
        op = msg.operation;
      }

      function errHandler(err) {
        msg.code = 500;
        msg.payload = err;
        node.send(msg);
      }

      if (op == 'listJobs') {
        client.listJobs().then(function(jobs) {
          msg.code = 200;
          msg.payload = jobs;
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'deleteJobs') {
        client.deleteJobs().then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'getJob') {
        var jobid = msg.payload;
        client.getJob(jobid).then(function(job) {
          msg.code = 200;
          msg.payload = job;
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'deleteJob') {
        var jobid = msg.payload;
        client.deleteJob(jobid).then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'getJobExecutionStatus') {
        var jobid = msg.payload;
        client.getJobExecutionStatus(jobid).then(function(status) {
          msg.code = 200;
          msg.payload = status;
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'abortJob') {
        var jobid = msg.payload.jobid;
        var kill = msg.payload.kill || false;
        client.abortJob(jobid, kill).then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'updateAttachment') {
        var jobid = msg.payload.jobid;
        var attid = msg.payload.attid;
        var stream = msg.payload.file ? fs.createReadStream(msg.payload.file) : null;
        client.updateAttachment(jobid, attid, stream).then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'downloadAttachment') {
        var jobid = msg.payload.jobid;
        var attid = msg.payload.attid;
        var stream = msg.payload.file ? fs.createWriteStream(msg.payload.file) : null;
        client.downloadAttachment(jobid, attid, stream).then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'getLogItems' ) {
        var jobid = msg.payload.jobid;
        var start = msg.payload.start;
        var continuous = msg.payload.continuous || false;
        client.getLogItems(jobid, start, continuous).then(function(items) {
          msg.code = 200;
          msg.payload = items;
          node.send(msg);
        }).catch(errHandler);
      } else if (op == 'downloadLog' ) {
        var jobid = msg.payload.jobid;
        var stream = msg.payload.file ? fs.createWriteStream(msg.payload.file) : null;

        client.downloadLog(jobid, stream).then(function() {
          msg.code = 200;
          msg.payload = 'OK';
          node.send(msg);
        }).catch(errHandler);
      }
    });
  }

  RED.nodes.registerType('docloud job', DocloudJobNode);


  function DocloudEventNode(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    var docloud = context.get('docloud');
    var eventbus = context.get('eventbus');

    function changeStatus() {
      node.conf = RED.nodes.getNode(config.conf);
      // setup status
      var clientName = node.conf ? node.conf.toString() : null;
      if (!clientName && docloud.getDefault()) {
        if (typeof docloud.getDefault().toString === 'function') {
          clientName = docloud.getDefault().toString();
        } else {
          clientName = docloud.getDefault().url ? docloud.getDefault().url + ':******' : null;
        }
      }

      if (clientName) {
        node.status({
          fill: "green",
          shape: "dot",
          text: clientName
        });
      } else {
        node.status({
          fill: "red",
          shape: "dot",
          text: "Undefined"
        });
      }

    }

    eventbus.on(DEFAULT_CONFIG_CHANGE_EVENT, function (msg) {
      changeStatus();
    });

    changeStatus();

    var event = 'fx-red-docloud.job.' + config.event;

    function handler(message) {
      node.send(message);
    }

    eventbus.on(event, handler);

    this.on('close', function() {
      eventbus.removeListener(event, handler);
    });
  }

  RED.nodes.registerType('docloud event in', DocloudEventNode);

  /* Configuration Node */
  function DocloudConfigNode(config) {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.url = config.url;
    this.key = this.credentials.key;

    this.toString = function () {
      if (this.name) {
        return this.name;
      }
      return this.url + ':******';
    }
  }

  RED.nodes.registerType('docloud config', DocloudConfigNode, {
    credentials: {
      key: {
        type: "password"
      }
    }
  });
};