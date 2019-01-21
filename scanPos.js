const CoinNodeObj = require('conf/coinNodeObj.js')
const sleep = require('ko-sleep')
let log = console

let web3Instance = new CoinNodeObj(log, 'wan');

mainLoop();


async function mainLoop() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();

  let addrCount = []

  let ret =  web3.eth.blockNumber

  for (let i = 0; i < ret; i++) {
    block = await web3.eth.getBlock(ret - i)

    if (addrCount[block.miner] == undefined) {
      addrCount[block.miner] = 0
    }

    addrCount[block.miner]++
  }

  log.info(ret)
  log.info(addrCount)
  let timeOld = 0

  while (true) {
    let retNew =  web3.eth.blockNumber
    if (retNew > ret) {
      for (let i = ret; i < retNew; i++) {
        block = await web3.eth.getBlock(i)

        if (addrCount[block.miner] == undefined) {
          addrCount[block.miner] = 0
        }

        addrCount[block.miner]++
      }

      let timeNow = Date.now()/1000
      let now = new Date(timeNow*1000)
      log.info("-----------------------------------")
      log.info(retNew + " Time:" + now.toISOString() + " Duration: " + (timeNow - timeOld))
      log.info(addrCount)
      ret = retNew
      timeOld = timeNow

      for (const key in addrCount) {
        if (addrCount.hasOwnProperty(key)) {
          const value = addrCount[key];
          log.info(key + " : " + value*100/retNew + "%")
        }
      }
    } else {
      await sleep(200)
    }
  }
}