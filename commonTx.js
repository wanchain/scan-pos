'use strict'

const CoinNodeObj = require('conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const from = "0xcf696d8eea08a311780fb89b20d4f0895198a489"
const to = "0x435b316A70CdB8143d56B3967Aacdb6392FD6125"
let lastBlock = 0
main();

async function checkBlock() {
  let blockNumber  = await pu.promisefy(web3.eth.getBlockNumber,[], web3.eth)
  if(blockNumber != lastBlock){
    lastBlock = blockNumber
    let block = await pu.promisefy(web3.eth.getBlock,[blockNumber,true], web3.eth)
    log.log("block ",blockNumber, "has ", block.transactions.length, " txs")
  }

}
async function main() {
  while(1){
    checkBlock()
    try {
      let txpoolStatus = await pu.promisefy(web3.txpool.status,[], web3.txpool)
      if(txpoolStatus.pending > 10000){
        await pu.sleep(1000)
        continue
      }
    }catch(err){
      log.error("web3.txpool.status: ",err)
    }

    for(let i=0; i<4000; i++) {
      pu.promisefy(web3.eth.sendTransaction, [{from:from, to:to, value: 100}], web3.eth)
    }
    await pu.sleep(1000)
    log.log("send 4000 txs")
  }

  console.log("done.")
}