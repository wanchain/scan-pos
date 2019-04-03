const CoinNodeObj = require('conf/coinNodeObj.js')
const sleep = require('ko-sleep')
var json2xls = require('json2xls');
const optimist = require('optimist');
const fs = require('fs')
const pu=require('promisefy-util')

let argv = optimist
  .usage('Usage: $0 -b [beginBlock] -e [endBlock]')
  .demand(['e'])
  .default('b', 0)
  .argv;

let beginBlock = argv.b;
let endBlock = argv.e;

let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');


mainLoopAsync()

async function getBlock(i) {
  block = await pu.promisefy(web3.eth.getBlock, [i], web3.eth)
  block.logsBloom = block.logsBloom.length
  block.extraData = block.extraData.length
  block.transactions = block.transactions.length

  let epID = block.difficulty.div(web3.toBigNumber('0x100000000')).floor(0)
  let epID000 = epID.mul(web3.toBigNumber('0x100000000'))

  let slotID = block.difficulty.minus(epID000).div(web3.toBigNumber(256)).floor(0)
  block.epochID = epID.toString()
  block.slotID = slotID.toString()
  return block
}

async function mainLoopAsync() {
  log.info("\nMain loop begins...Wait");
  web3 = web3Instance.getClient();
  let ret = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
  console.log("Total blocks: " + ret.toString())
  ret = ret > endBlock ? endBlock : ret


  let pros = [];
  let blocks = [];
  for (let i = beginBlock; i < ret; i++) {
    pros.push(new Promise(async (resolve) => {
      console.log("block: " + i + " started")
      let block = await getBlock(i);
      blocks[i - beginBlock] = block;
      console.log("block: " + i + " finined")
      resolve();
    }))

    if (i%100 == 0) {
      await sleep(1000)
    }
  }

  await Promise.all(pros)

  var xls = json2xls(blocks);
  fs.writeFileSync('blocks.xlsx', xls, 'binary');

  console.log("all finish")
}
