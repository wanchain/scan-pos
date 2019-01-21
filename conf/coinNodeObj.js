const Web3 = require('web3');
const web3ext = require('util/web3ext')
const fs = require("fs");
const config = require('conf/config');
const BtcClient = require('bitcoin-core');
const path = require('path');
let coinNodeConfig = require('conf/coinNodeConfig.json');

const btcUser = process.env.BTC_USER;
const btcPassword = process.env.BTC_PWD;

/* istanbul ignore next */
if (!btcUser || !btcPassword) {
  console.log('------------If you use btc, Please config the $BTC_USER and $BTC_PWD first.-----------')
}

class CoinNodeObj {
  constructor(logger, chainType) {
    try {
      this.logger = logger;
      this.chainType = chainType.toLowerCase();
      this.network = config.network;

      this.nodeUrl = this.getUrl();
      this.logger.info('Coin node url: ' + this.nodeUrl);

      if (this.nodeUrl.includes('http')) {
        this.client = new Web3(new Web3.providers.HttpProvider(this.nodeUrl));
      } else {
        let ipPort = this.nodeUrl.split(':');
        this.client = this._getBtcClient(ipPort);
      }
      web3ext.extend(this.client)
    } catch (error) {
      logger.error(error);
    }
  }

  _getBtcClient(ipPort) {
    return new BtcClient({
      network: config.network,
      host: ipPort[0],
      port: Number(ipPort[1]),
      username: btcUser,
      password: btcPassword,
      timeout: 600000
    });
  }

  getUrl() {
    try {
      coinNodeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'coinNodeConfig.json')));
    } catch (error) {
      /* istanbul ignore next */
      this.logger.warn(error);
    }
    return coinNodeConfig.url[this.chainType][this.network];
  }

  getClient() {
    let tmpUrl = this.getUrl();
    if (this.nodeUrl !== tmpUrl) {
      this.nodeUrl = tmpUrl;
      if (this.nodeUrl.includes('http')) {
        this.client = new Web3(new Web3.providers.HttpProvider(this.nodeUrl));
      } else {
        let ipPort = this.nodeUrl.split(':');
        this.client = this._getBtcClient(ipPort);
      }
      this.logger.warn('Coin node URL is changed to:', this.nodeUrl);
    }
    return this.client;
  }

  getAllClients() {
    let clients = [];
    for (let index = 0; index < coinNodeConfig.nodes[this.chainType][config.network].length; index++) {
      try {
        const url = coinNodeConfig.nodes[this.chainType][config.network][index];
        let ipPort = url.split(':');
        let client = this._getBtcClient(ipPort);
        /* istanbul ignore else  */
        if (client) {
          clients.push(client);
        }
      } catch (error) {
      /* istanbul ignore next */
        this.logger.warn(error);
      }
    }
    return clients;
  }
}
module.exports = CoinNodeObj;