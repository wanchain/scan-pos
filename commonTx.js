'use strict'

let CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
const wanUtil = require('wanchain-util');


var Tx = wanUtil.wanchainTx;

let from = ""
let to = ""

// Fill the privateKey's json String
var privateKeyJsonString = ""
if (true) {
  from = "0x435b316A70CdB8143d56B3967Aacdb6392FD6125";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  to = "0xcf696d8eea08a311780fb89b20d4f0895198a489"
  privateKeyJsonString = '{"type":"Buffer","data":"0x5389e1113c92251542c446b287e63c1033313a28d5623219a02ac3d13e1167c4"}'
  //privateKeyJsonString = "0x5389e1113c92251542c446b287e63c1033313a28d5623219a02ac3d13e1167c4"
} else {
  from = "0xcf696d8eea08a311780fb89b20d4f0895198a489";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
  to = "0x9cd8230d43464aE97F60BAD6DE9566a064990E55"
  privateKeyJsonString = '{"type":"Buffer","data":[]}'
}

var privateKey = Buffer.from(JSON.parse(privateKeyJsonString).data);


let gGasLimit = 22000;
let gGasPrice = 280000000000; // 200G

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
  // log.log("1.1.1")

  var rawTx = {
    Txtype: 0x01,
    nonce: nonce++,
    gasPrice: gGasPrice,
    gasLimit: gGasLimit,
    to: to,
    chainId: 3,
    value: '0x02'
  };
  const tx = new Tx(rawTx);
  log.log("1.1.2")
console.log("privateKey:", privateKey)
  tx.sign(privateKey);
  log.log("1.2")

  const serializedTx = tx.serialize();
  return "0x" + serializedTx.toString('hex')
}


function jsonTx() {
  // log.log("1.1.1")

  var rawTx = {
    from: from,
    Txtype: 0x01,
    nonce: nonce++,
    gasPrice: gGasPrice,
    gasLimit: gGasLimit,
    to: to,
    chainId: 3,
    value: '0x02'
  };
  return rawTx
}

let startTime = new Date()
let txCount = 10
let nonce = null
async function main() {
  // while(!nonce) {
  //   web3.eth.getTransactionCount(from, null, (no) => { nonce = no;console.log("nonce:", nonce); });
  //   await pu.sleep(1000)
  // }

  nonce = await  pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
  console.log("nonce:", nonce)

  while (1) {
    //checkBlock()
    try {
      let txpoolStatus = await pu.promisefy(web3.txpool.status, [], web3.txpool)
      let pendingNumber = Number(txpoolStatus.pending)
      log.log(new Date(), "pending: ", pendingNumber)
      if (pendingNumber > 100) {
        await pu.sleep(1000)
        continue
      }
    } catch (err) {
      log.error("web3.txpool.status: ", err)
    }
    // log.log("1")
    let rs = [];
    for (let i = 0; i < txCount; i++) {
      let tx = jsonTx()
      // log.log("1.1")
      let r = pu.promisefy(web3.personal.sendTransaction, [tx,"wanglu"], web3.personal);
      rs.push(r)
    }
    // log.log("2")
    await Promise.all(rs)
    totalSendTx += txCount
    //await pu.sleep(1000)
    let timePass = new Date() - startTime;
    // log.log("3")
    timePass = timePass / 1000

    log.log(new Date(), "send ", txCount, " txs, total:", totalSendTx, "tps: ", totalSendTx / timePass)
  }

  console.log("done.")
}

main();
