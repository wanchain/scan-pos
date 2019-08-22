'use strict'

let CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
const wanUtil = require('wanchain-util');
const optimist = require('optimist');


let argv = optimist
  .usage('Usage: $0 -a [fromAddr without 0x] -p [privateKey without 0x]')
  .default('a', "9da26fc2e1d6ad9fdd46138906b0104ae68a65d8")
  .default('p', "b6a03207128827eaae0d31d97a7a6243de31f2baf99eabd764e33389ecf436fc")
  .argv;

// let beginBlock = argv.b;
// let endBlock = argv.e;

console.log(argv.a, argv.p)

var Tx = wanUtil.wanchainTx;

let from = "0x" + argv.a;//"0x7e724e043ac584f196057ef9e6cc834d2e2847b2"
let privKeyString = argv.p; //8783e12bada18492d40f5e0542af1eaa11b9f5dead962d3cf6bb672195776d14
let to = "0x47589e0858026460cf8fecb7cf9e0f32e4ee179c"

var privateKey = Buffer.from(privKeyString, 'hex');//0x7e724e043ac584f196057ef9e6cc834d2e2847b2
//var privateKey = Buffer.from("9166b12e30d8b599e4cf400b9ff33fa5f752f5704d815a4353686383915950a2",'hex');//0x47589e0858026460cf8fecb7cf9e0f32e4ee179c


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
    chainId: 4,
    value: '0x02'
  };
  const tx = new Tx(rawTx);

  tx.sign(privateKey);
  const serializedTx = tx.serialize();
  return "0x" + serializedTx.toString('hex')
}

let startTime = new Date()
let txCount = 100
let nonce = null
let reorgTimes = 0
let zeroTimes = 0
async function main() {
  // while(!nonce) {
  //   web3.eth.getTransactionCount(from, null, (no) => { nonce = no;console.log("nonce:", nonce); });
  //   await pu.sleep(1000)
  // }
  nonce = await pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
  console.log("nonce:", nonce)
  while (1) {
    //checkBlock()
    try {
      let epID = await pu.promisefy(web3.pos.getEpochID, [])
      let reorgRet = await pu.promisefy(web3.pos.getReorgState, [epID])
      console.log('reorg:', reorgRet);
      if (reorgRet && reorgRet[0] > reorgTimes) {
        reorgTimes = reorgRet[0]
        nonce = await pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
        console.log("nonce:", nonce)
      }

      let txpoolStatus = await pu.promisefy(web3.txpool.status, [], web3.txpool)
      let pendingNumber = Number(txpoolStatus.pending)
      log.log(new Date(), "pending: ", pendingNumber)
      if (pendingNumber > 80000) {
        await pu.sleep(1000)
        continue
      }

      if (pendingNumber == 0) {
        zeroTimes++;
        if (zeroTimes > 10) {
          await pu.sleep(1000)
          nonce = await pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
          console.log("nonce:", nonce)
          zeroTimes = 0;
          continue
        }
      } else {
        zeroTimes = 0;
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

    } catch (err) {
      log.error(err)
      await pu.sleep(1000)
      nonce = await pu.promisefy(web3.eth.getTransactionCount, [from], web3.eth);
      console.log("nonce:", nonce)
    }
  }

  console.log("done.")
}

main();
