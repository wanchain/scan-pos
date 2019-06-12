const CoinNodeObj = require('conf/coinNodeObj.js')
const fs = require('fs')
const pu=require('promisefy-util')


let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
const beginBlock = 6
const K=10
const slotCount=12*K
let lastSlotID = beginBlock-1

mainLoopAsync()



async function mainLoopAsync() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();
  let curBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
  console.log("Total blocks: " + curBlock.toString())


  for (let i = beginBlock; i < curBlock; i++) {
    let block = await pu.promisefy(web3.eth.getBlock, [i], web3.eth)
    console.log(block.number)
    let slotID = block.slotId
    let gap = 1
    if(slotID < lastSlotID)  {
      gap = slotID+slotCount-lastSlotID
    } else {
      gap = slotID - lastSlotID
    }
    if(gap != 1) {
      console.log("miss block: ",gap-1, "block number:", block.number)
    }
    lastSlotID = slotID
  }



  console.log("all finish")
}
