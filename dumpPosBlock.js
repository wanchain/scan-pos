const CoinNodeObj = require('conf/coinNodeObj.js')
const sleep = require('ko-sleep')
var json2xls = require('json2xls');
const optimist = require('optimist');
const fs = require('fs')

let argv = optimist
  .usage('Usage: $0 -b [beginBlock] -e [endBlock]')
  .demand(['e'])
  .default('b', 0)
  .argv;

let beginBlock = argv.b;
let endBlock = argv.e;

let log = console

let web3Instance = new CoinNodeObj(log, 'wan');

mainLoop();


async function mainLoop() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();

  let ret =  web3.eth.blockNumber

  let blocks = []

  console.log("Total blocks: " + ret.toString())

  ret = ret > endBlock ? endBlock : ret

  if (ret < 1) {
    return
  } 

  block0 = await web3.eth.getBlock(1)
  let gensisTime = block0.timestamp
  console.log(gensisTime)

  let m = 0
  for (let i = beginBlock; i < ret; i++) {
    block = await web3.eth.getBlock(i)
    block.logsBloom = block.logsBloom.length
    block.extraData = block.extraData.length
    block.transactions = block.transactions.length
    
    let epID = block.difficulty.div(web3.toBigNumber('0x100000000')).floor(0)
    let epID000 = epID.mul(web3.toBigNumber('0x100000000'))

    let slotID = block.difficulty.minus(epID000).div(web3.toBigNumber(256)).floor(0)
    block.epochID = epID.toString()
    block.slotID = slotID.toString()

    // timeUnix = Date.now()/1000
    // slotTime = 3
    // slotCount = 100
    // epochTimespan = Number( slotTime * slotCount )
    // epochIdTime = Number((timeUnix - gensisTime) / epochTimespan)
    // slotIdTime = Number((timeUnix - gensisTime) / slotTime % slotCount)

    // block.epochIDFromTime = epochIdTime
    // block.slotIDFromTime = slotIdTime

    blocks.push(block)
    console.log(i)
    m++;

    if (m % 100 == 0) {
      await sleep(1000);
    }
  }

  var xls = json2xls(blocks);
  fs.writeFileSync('blocks.xlsx', xls, 'binary');
}