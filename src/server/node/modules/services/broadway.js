/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2017, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
/*eslint strict:["error", "global"]*/
'use strict';

const _instance = require('./../../core/instance.js');
const _spawn = require('child_process').spawn;
const _ws = require('ws').Server;

var wss;

/*
 * Unloads broadway daemons
 */
module.exports.destroy = function() {
  return new Promise(function(resolve, reject) {
    if ( wss ) {
      wss.close(resolve);
    }
    return resolve();
  });
};

/*
 * Registers the broadway daemon
 */
module.exports.register = function(env, config, servers) {
  if ( !config.broadway || !config.broadway.enabled ) {
    return;
  }

  const logger = _instance.getLogger();
  const defaults = config.broadway.defaults;

  function spawnBroadwayProcess(launch) {
    const cmd = 'nohup';
    const args = [launch];

    const env = Object.assign({}, process.env);
    Object.keys(defaults.env).forEach(function(k) {
      env[k] = defaults.env[k];
    });

    _spawn(cmd, args, {env: env});

    /*
    const ls = _spawn(cmd, args, {env: env});

    ls.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
    });

    ls.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
    });

    ls.on('error', function(data) {
      console.log('error: ' + data);
    });

    ls.on('close', function(code) {
      console.log('child process exited with code ' + code);
    });
    */
  }

  try {
    const port = defaults.spawner.port;
    logger.lognt('INFO', 'Service:', logger.colored('Broadway', 'bold'), 'is starting up on port', logger.colored(port, 'bold'));

    wss = new _ws({
      port: port
    });

    wss.on('connection', function(ws) {
      logger.log('INFO', 'Incoming broadway connection');

      ws.on('message', function(message) {
        const json = JSON.parse(message);
        if ( json.method === 'launch' ) {
          spawnBroadwayProcess(json.argument);
        }
      });
    });

  } catch ( e ) {
    logger.log('ERROR', e);
  }

};
