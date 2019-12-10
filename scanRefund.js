`use strict`

const CoinNodeObj = require('./conf/coinNodeObj.js')
const pu = require("promisefy-util")
let log = console
const assert = require('assert');

let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient()
const begin = 4132976  // 5679571 //4785344 // 4132976
const concurrence = 1024
const scAddr = "0x00000000000000000000000000000000000000da"
async function main() {
    //let end = await pu.promisefy(web3.eth.getBlockNumber,[],web3.eth);
    let end = begin+1
    Array(concurrence).fill(0).forEach(async (_,i)=>{
        //console.log(i)
        for(let k=begin+i;  k<end; k+=concurrence) {
            let scBalance = await pu.promisefy(web3.eth.getBalance,[scAddr,k],web3.eth)
            //console.log("scBalance:", scBalance.toString(16))
            let info = await pu.promisefy(web3.pos.getStakerInfo,[k],web3.pos)
            console.log("staker info:",JSON.stringify(info))
            calAmount = web3.toBigNumber(0)
            //console.log("xxxx:",info)
            info.forEach((staker)=>{
                calAmount = calAmount.add(web3.toBigNumber(staker.amount))
                staker.clients.forEach((client)=>{
                    calAmount = calAmount.add(web3.toBigNumber(client.amount))
                })
                staker.partners.forEach((partner)=>{
                    calAmount = calAmount.add(web3.toBigNumber(partner.amount))
                })
            })
            //console.log("calAmount:", calAmount.toString(16))
            console.log("block:",k,"scBalance:",web3.fromWei(scBalance).toString(10),"calAmount:",web3.fromWei(calAmount).toString(10))
            assert(calAmount.toString(16) === scBalance.toString(16), "Balance is not match")
        }
    })


}
main();