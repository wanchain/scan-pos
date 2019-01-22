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

  for (let i = beginBlock; i < ret; i++) {
    block = await web3.eth.getBlock(i)

    blocks[i] = block
    blocks[i].logsBloom = blocks[i].logsBloom.length.toString()
    blocks[i].extraData = blocks[i].extraData.length.toString()
    console.log(i)
  }

  var xls = json2xls(blocks);
  fs.writeFileSync('blocks.xlsx', xls, 'binary');
}