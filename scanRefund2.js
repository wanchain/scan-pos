`use strict`

const CoinNodeObj = require('./conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
const assert = require('assert');

let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const MISS = web3.toBigNumber(web3.toWei(2500))

const scAddr = "0x00000000000000000000000000000000000000da"
async function main() {
    setInterval(async function(){
        let curBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
        let scBalance = await pu.promisefy(web3.eth.getBalance,[scAddr,curBlock],web3.eth)
        let info = await pu.promisefy(web3.pos.getStakerInfo,[curBlock],web3.pos)
        calAmount = web3.toBigNumber(0)
        info.forEach((staker)=>{
            calAmount = calAmount.add(web3.toBigNumber(staker.amount))
            staker.clients.forEach((client)=>{
                calAmount = calAmount.add(web3.toBigNumber(client.amount))
            })
            staker.partners.forEach((partner)=>{
                calAmount = calAmount.add(web3.toBigNumber(partner.amount))
            })
        })
        if(calAmount.toString(16) == scBalance.add(MISS).toString(16)){
            console.log("block:",curBlock,"scBalance:",web3.fromWei(scBalance).toString(10),"calAmount:",web3.fromWei(calAmount).toString(10))
            console.log("block:",curBlock,": balance is  match")
        }else{
            console.log("block:",curBlock,"scBalance:",web3.fromWei(scBalance).toString(10),"calAmount:",web3.fromWei(calAmount).toString(10))
            console.log("block:",curBlock,": balance is not match")
        }
    }, 5000)
}
main();