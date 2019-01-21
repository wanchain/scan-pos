const CoinNodeObj = require('conf/coinNodeObj.js')
const sleep = require('ko-sleep')
let log = console

let web3Instance = new CoinNodeObj(log, 'wan');

const rbScAddr = "0x0000000000000000000000000000000000000262";
const slotScAddr = "0x0000000000000000000000000000000000000258";
let block;
let slotSize = 0
let rbSize = 0
statistics();


async function statistics() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();

  let addrCount = []

  let ret =  web3.eth.blockNumber

  for (let i = 0; i < ret; i++) {
    block =  web3.eth.getBlock(i, true)

    if (addrCount[block.miner] == undefined) {
      addrCount[block.miner] = 0
    }

    addrCount[block.miner]++

    // block.transactions.forEach((item,index)=>{
    //   if(slotScAddr === item.to){
    //     let rawTx = web3.eth.getRawTransaction(item.hash)
    //     slotSize += Buffer.byteLength(rawTx, 'utf8')
    //   }
    //   if(rbScAddr === item.to) {
    //     let rawTx = web3.eth.getRawTransaction(item.hash)
    //     rbSize += Buffer.byteLength(rawTx, 'utf8')
    //   }
    // })
  }

  log.info(ret)
  log.info(addrCount)
  log.info("slotSize:", slotSize)
  log.info("rbSize:", rbSize)
}