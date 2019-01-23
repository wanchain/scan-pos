const CoinNodeObj = require('conf/coinNodeObj.js')
//const date = require('date')
const pu = require("promisefy-util")
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
  if(process.argv.length >2) {
    ret = process.argv[2]
  }

  blocksP = []
  for(let j=1; j<ret; j+=1024) {
    for (let i = j; i < 1024 && i<ret; i++) {
      //block =  web3.eth.getBlock(i, true)
      blockp = pu.promisefy(web3.eth.getBlock, [i,true], web3.eth);
      blocksP.push(blockp)
      //console.log("Time:", Date.now(), "blocknumber: ", i)


    }
    let blocks = await Promise.all(blocksP)
    for(let i=0; i<blocks.length; i++) {
      let block = blocks[i]
      if (addrCount[block.miner] == undefined) {
        addrCount[block.miner] = 0
      }


      addrCount[block.miner]++
      let slottxPS = []
      let rbtxPS = []
      block.transactions.forEach((item,index)=>{
        if(slotScAddr === item.to){
          let rawTx = pu.promisefy(web3.eth.getRawTransaction,[item.hash],web3.eth)
          slottxPS.push(rawTx)

        }
        if(rbScAddr === item.to) {
          let rawTx = pu.promisefy(web3.eth.getRawTransaction,[item.hash],web3.eth)
          rbtxPS.push(rawTx)
        }
      })
      let slotTxs = await Promise.all(slottxPS)
      let rbTxs = await Promise.all(rbtxPS)
      rbTxs.forEach(item=>{
        rbSize += Buffer.byteLength(item, 'utf8')
      })
      slotTxs.forEach(item=>{
        slotSize += Buffer.byteLength(item, 'utf8')
      })
    }
  }


  log.info(ret)
  log.info(addrCount)
  log.info("slotSize:", slotSize)
  log.info("rbSize:", rbSize)
}
