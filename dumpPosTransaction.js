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

  let txs = []

  console.log("Total blocks: " + ret.toString())

  ret = ret > endBlock ? endBlock : ret

  let count = 0

  for (let i = beginBlock; i < ret; i++) {
    block = await web3.eth.getBlock(i)
    if (block.transactions != undefined && block.transactions.length > 0) {
      for (let m = 0; m < block.transactions.length; m++) {
        const txID = block.transactions[m];
        let tx = await web3.eth.getTransaction(txID)
        tx.input = tx.input.length.toString()
        txs[txs.length] = tx
        console.log("tx:" + m)
        if (count++ % 100 == 0) {
          await sleep(1000)
        }
      }
    }
    console.log("block:" + i)
  }

  var xls = json2xls(txs);
  fs.writeFileSync('transactions.xlsx', xls, 'binary');
}