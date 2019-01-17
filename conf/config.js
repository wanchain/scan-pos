const path = require('path');
const fs = require('fs');

const testNet = true;
const network = testNet?'testnet':'mainnet';

/*MainNet config*/
const serverPort = 443;
const logServerUrl = '127.0.0.1';
const logServerPort = 514;

/*testNet config*/
const serverTestPort = 443;
const logServerTestUrl = '127.0.0.1';
const logServerTestPort = 515;

exports.network = network;

exports.serverPort = testNet?serverTestPort:serverPort;
exports.logServerUrl = testNet?logServerTestUrl:logServerUrl;
exports.logServerPort = testNet?logServerTestPort:logServerPort;
exports.testNet = testNet;

