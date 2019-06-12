const CoinNodeObj = require('conf/coinNodeObj.js')
const fs = require('fs')
const pu=require('promisefy-util')


let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');
const beginBlock = 1555
const K=10
const slotCount=12*K
let lastSlotID = beginBlock-1

mainLoopAsync()



async function mainLoopAsync() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();
  let info = await pu.promisefy(web3.pos.getPosInfo, [], web3.pos)
  let curEpoch = await pu.promisefy(web3.pos.getEpochID, [], web3.pos);
  console.log("firstEpochId: ", info.firstEpochId);

  console.log('epochID', 'sltActivity', 'missEL', 'missRNP')

  for (let i = info.firstEpochId; i < curEpoch; i++) {
    let act = await pu.promisefy(web3.pos.getActivity, [i], web3.pos);
    let missEp = 0;
    let missRp = 0;
    for (let m=0; m<act.epActivity.length; m++) {
      if(act.epActivity[m] == 0) {
        missEp++;
      }
    }

    for (let m=0; m<act.rpActivity.length; m++) {
      if(act.rpActivity[m] == 0) {
        missRp++;
      }
    }
    
    console.log(i, act.slActivity, missEp, missRp)
  }

  console.log("all finish")
}
