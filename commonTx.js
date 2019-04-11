'use strict'

let CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const from = "0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0x9cd8230d43464aE97F60BAD6DE9566a064990E55";//"0xC4F682E30aa722053C52feA538db77e2042F7980"
const to = "0xcf696d8eea08a311780fb89b20d4f0895198a489"
let lastBlock = 0
main();

let totalSendTx = 0;

async function checkBlock() {
  let blockNumber  = await pu.promisefy(web3.eth.getBlockNumber,[], web3.eth)
  if(blockNumber != lastBlock){
    lastBlock = blockNumber
    let block = await pu.promisefy(web3.eth.getBlock,[blockNumber,true], web3.eth)
    log.log(new Date(), ">>>>>>>>>>>>>>>> block ",blockNumber, "has ", block.transactions.length, " txs")
  }

}

let startTime = new Date()
async function main() {
  while(1){
    //checkBlock()
    try {
      let txpoolStatus = await pu.promisefy(web3.txpool.status,[], web3.txpool)
      let pendingNumber = Number(txpoolStatus.pending)
      log.log(new Date(), "pending: ", pendingNumber)
      if(pendingNumber > 80000){
        await pu.sleep(1000)
        continue
      }
    }catch(err){
      log.error("web3.txpool.status: ",err)
    }

    let rs=[];
    for(let i=0; i<3000; i++) {
      let r = pu.promisefy(web3.eth.sendTransaction, [{from:from, to:to, value: 100}], web3.eth)
      rs.push(r)
    }
    await Promise.all(rs)
    totalSendTx+=3000
    //await pu.sleep(1000)
    let timePass = new Date() - startTime;

    timePass = timePass / 1000
    
    log.log(new Date(), "send 3000 txs, total:", totalSendTx, "tps: ", totalSendTx/timePass)
  }

  console.log("done.")
}
