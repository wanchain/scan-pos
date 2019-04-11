'use strict'

let CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
const wanUtil = require('wanchain-util');


var Tx = wanUtil.wanchainTx;

let from = ""
let to = ""

// Fill the privateKey's json String
var privateKeyJsonString = ""
if (!true) {
  from = "0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  to = "0xcf696d8eea08a311780fb89b20d4f0895198a489"
  privateKeyJsonString = ""
} else {
  from = "0xcf696d8eea08a311780fb89b20d4f0895198a489";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  to = "0x9cd8230d43464aE97F60BAD6DE9566a064990E55"
  privateKeyJsonString = ""
}

var privateKey = Buffer.from(JSON.parse(privateKeyJsonString).data);


let gGasLimit = 22000;
let gGasPrice = 200000000000; // 200G

let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()

let lastBlock = 0

let totalSendTx = 0;

async function checkBlock() {
  let blockNumber = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
  if (blockNumber != lastBlock) {
    lastBlock = blockNumber
    let block = await pu.promisefy(web3.eth.getBlock, [blockNumber, true], web3.eth)
    log.log(new Date(), ">>>>>>>>>>>>>>>> block ", blockNumber, "has ", block.transactions.length, " txs")
  }

}



function SignTx() {
  var rawTx = {
    Txtype: 0x01,
    nonce: nonce++,
    gasPrice: gGasPrice,
    gasLimit: gGasLimit,
    to: to,
    chainId: 6,
    value: '0x02'
  };
  const tx = new Tx(rawTx);

  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return "0x" + serializedTx.toString('hex')
}

let startTime = new Date()
let txCount = 6000
let nonce = 0
async function main() {
  web3.eth.getTransactionCount(from, null, (no) => { nonce = no });
  await pu.sleep(1000)
  while (1) {
    //checkBlock()
    try {
      let txpoolStatus = await pu.promisefy(web3.txpool.status, [], web3.txpool)
      let pendingNumber = Number(txpoolStatus.pending)
      log.log(new Date(), "pending: ", pendingNumber)
      if (pendingNumber > 800000) {
        await pu.sleep(1000)
        continue
      }
    } catch (err) {
      log.error("web3.txpool.status: ", err)
    }

    let rs = [];
    for (let i = 0; i < txCount; i++) {
      let tx = SignTx()
      let r = pu.promisefy(web3.eth.sendRawTransaction, [tx], web3.eth);
      rs.push(r)
    }
    await Promise.all(rs)
    totalSendTx += txCount
    //await pu.sleep(1000)
    let timePass = new Date() - startTime;

    timePass = timePass / 1000

    log.log(new Date(), "send ", txCount, " txs, total:", totalSendTx, "tps: ", totalSendTx / timePass)
  }

  console.log("done.")
}

main();
