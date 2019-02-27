'use strict'

const CoinNodeObj = require('conf/coinNodeObj.js')
const json2xls = require('json2xls');
const fs=require('fs')
const pu = require("promisefy-util")
let log = console

let web3Instance = new CoinNodeObj(log, 'wanipc');

main();

async function main() {
  log.info("\nMain loop begins...Wait");
  let web3 = web3Instance.getClient();

  let addrCount = []
  let infos = []
  let blockNumber =  await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)

  for(let j=0; j<blockNumber; j+=1000) {
    let blocksP = []
    console.log("blockNumber: ", j)
    for (let i = j; i<j+1000 && i<blockNumber; i++) {
      //block =  web3.eth.getBlock(i, true)
      let blockp = pu.promisefy(web3.eth.getBlock, [i,true], web3.eth);
      blocksP.push(blockp)
    }
    let blocks = await Promise.all(blocksP)
    for(let i=0; i<blocks.length; i++) {
      let block = blocks[i]
      block.transactions.forEach((item,index)=>{
        if(item.to && -1 == addrCount.indexOf(item.to)){
          addrCount.push(item.to)
          log.info("found ", item.to)
        }
      })
    }
  }
  let balancePS = []
  addrCount.forEach((item)=>{
    let balanceP = pu.promisefy(web3.eth.getBalance, [item], web3.eth)
    balancePS.push(balanceP)
  })
  let balances = await Promise.all(balancePS)
  for(let i=0; i<addrCount.length; i++){
    let info = {}
    info.address = addrCount[i]
    info.balance = balances[i]
    infos.push(info)
  }
  infos.sort((a,b)=>{
    return b.balance.cmp(a.balance)
  })
  let totalBalance = new web3.toBigNumber(0)
  infos.forEach((item)=>{
    totalBalance = item.balance.add(totalBalance)
    item.balance = web3.fromWei(item.balance).toString(10)
  })
  console.log("totalBalance: ", web3.fromWei(totalBalance).toString(10))
  log.info(blockNumber)
  var xls = json2xls(infos);
  fs.writeFileSync('infos.xlsx', xls, 'binary');
  process.exit(0)
}
