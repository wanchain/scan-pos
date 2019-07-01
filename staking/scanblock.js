const CoinNodeObj = require('../conf/coinNodeObj.js')
const pu=require('promisefy-util')
const K=6
const SCALE = 1000000000
const SLSCALE=100000.0
const SlotTime=3
const posRB = "0x0000000000000000000000000000000000000262"
const posEL = "0x0000000000000000000000000000000000000258"
const accounts = [{validator:"0x23fc2eda99667fd3df3caa7ce7e798d94eec06eb",wallet:"0xbd100cf8286136659a7d63a38a154e28dbf3e0fd"}]
const wb = ["0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e","0x8b179c2b542f47bb2fb2dc40a3cf648aaae1df16"]
const stat = []
let ControledBlocks = {}
let totalblock = {}
ControledBlocks[0] = 0
const gasPool = {}
let log = console

let web3Instance = new CoinNodeObj(log, 'wan');
let web3 = web3Instance.getClient();
//const bonusEpoch = new web3.BigNumber("95129375951293759200",10)
const bonusEpoch = web3.toWei(web3.toBigNumber(2500000)).div(365*24*3600/SlotTime).mul(12*K).floor()
console.log("bonusEpoch:", bonusEpoch.toString(10))
const baseEp = 24
const baseRp = 25

function oneBlock(bonusEpoch,controlBlock){
    if(controlBlock == 12*K){
        return web3.toBigNumber(0)
    }
    let percentage = web3.toBigNumber(12).mul(SCALE).div(49).round()
    let ablock =  bonusEpoch.mul(percentage).div(SCALE).floor().div(12*K-controlBlock).floor()

    return ablock
}
function oneEplTx(bonusEpoch){
    let percentage = web3.toBigNumber(12).mul(SCALE).div(49).floor()
    let aep =  bonusEpoch.mul(percentage).div(SCALE).floor().div(baseEp).floor()
    return aep
}
function oneRnbTx(bonusEpoch){
    let percentage = web3.toBigNumber(25).mul(SCALE).div(49).round()
    console.log("oneRnbTx percentage: ", percentage)
    let arb = bonusEpoch.mul(percentage).div(SCALE).floor().div(baseRp).floor()
    return arb
}

mainLoopAsync()

function Init() {
    accounts.forEach((item,index)=>{
        stat[index] = {}
    })
}
async function getBlock(i) {
    block = await pu.promisefy(web3.eth.getBlock, [i,true], web3.eth)
    block.logsBloom = block.logsBloom.length
    block.extraData = block.extraData.length
    block.transactions = block.transactions

    let epID = block.difficulty.div(web3.toBigNumber('0x100000000')).floor(0)
    let epID000 = epID.mul(web3.toBigNumber('0x100000000'))

    let slotID = block.difficulty.minus(epID000).div(web3.toBigNumber(256)).floor(0)
    block.epochID = epID.toString()
    block.slotID = slotID.toString()
    //console.log(block.number, block.difficulty.toString(16), block.epochID, block.slotID)
    return block
}

async function calGasPool(block) {
    let gas = web3.toBigNumber(0)
    for(let i=0; i<block.transactions.length; i++){
        let receipt = await pu.promisefy(web3.eth.getTransactionReceipt, [block.transactions[i].hash], web3.eth)
        if(receipt){
            gas = gas.add(block.transactions[i].gasPrice.mul(receipt.gasUsed))
        }
    }
    return gas
}
async function calBlock(block) {
    let epochID = block.epochID
    if(!gasPool[epochID]) {
        gasPool[epochID] = new web3.BigNumber(0)
    }
    let blockgas = await calGasPool(block)
    gasPool[epochID] = gasPool[epochID].add(blockgas)

    if(wb.indexOf(block.miner) != -1 ) {
        if( ! ControledBlocks[epochID]) ControledBlocks[epochID] = 0
        ControledBlocks[epochID]++
    }
    if( ! totalblock[epochID]) totalblock[epochID] = 0
    totalblock[epochID]++
    accounts.forEach((item,index)=>{
        if( !stat[index][epochID] ){
            stat[index][epochID]= {}
            stat[index][epochID].block = 0
            stat[index][epochID].rbtx = 0
            stat[index][epochID].eptx = 0
        }
        if(block.miner == item.validator) {
            stat[index][epochID].block++
        }

        for(let i=0; i<block.transactions.length; i++) {
            let tx = block.transactions[i]
            if (tx.from == item.validator && tx.to == posEL){
                stat[index][epochID].eptx++
            }
            if (tx.from == item.validator && tx.to == posRB){
                stat[index][epochID].rbtx++
            }

        }
    })

}
let Incentived = false
async function check(epochID, lastBlockNumber, block) {
    let lastBps = []
    accounts.forEach((item,index)=>{
        let lastBp = pu.promisefy(web3.eth.getBalance,[item.wallet, lastBlockNumber], web3.eth)
        lastBps.push(lastBp)
    })
    let lastbs = await Promise.all(lastBps)

    let curBps = []
    accounts.forEach((item,index)=>{
        let curBp = pu.promisefy(web3.eth.getBalance,[item.wallet, lastBlockNumber+1], web3.eth)
        curBps.push(curBp)
    })
    let curbs = await Promise.all(curBps)

    stat.forEach((item,index)=>{
        let tgas = new web3.BigNumber(0)
        block.transactions.forEach((tx)=>{
            if (tx.from == accounts[index]){
                tgas = tgas.add(tx.gasPrice.mul(tx.gas))
            }
        })
        //console.log("tx gas in the incentive block:", web3.fromWei(tgas).toString(10))
        tgas = tgas.add(curbs[index])
        let realIncentive = tgas.minus(lastbs[index])
        if(realIncentive.cmp(0) > 0){
            Incentived = true
            console.log("check,  block number: ", block.number, "Incentived: ", Incentived)
        } else {
            console.log("check, no incentive. block number: ", block.number)
            return
        }
        console.log("epochID:", epochID,"summary:",item[epochID])
        console.log( "realIncentive:", web3.fromWei(realIncentive).toString(10), "gasPool:", web3.fromWei(gasPool[epochID]).toString(10))
        // -----
        let epochTotal = bonusEpoch.add(gasPool[epochID])
        console.log("epoch incentive Total:", epochTotal.toString(10),"gasPool[epochID]:", gasPool[epochID].toString(10), "bonusEpoch:",bonusEpoch.toString(10))

        let blockActive = web3.toBigNumber(totalblock[epochID]*SLSCALE).div(12*K).floor()
        if(!ControledBlocks[epochID]) {
            ControledBlocks[epochID] = 0
        }

        let b1 = oneBlock(epochTotal,ControledBlocks[epochID]).mul(blockActive).div(SLSCALE).floor().mul(item[epochID].block)
        if(-1 != wb.indexOf(accounts[index])){ b1 = web3.toBigNumber(0)}
        let b2 = oneEplTx(epochTotal).mul(parseInt(item[epochID].eptx/2))
        if(-1 != wb.indexOf(accounts[index])){ b2 = web3.toBigNumber(0)}
        let b3 = oneRnbTx(epochTotal).mul(parseInt(item[epochID].rbtx/3))
        console.log("b1,b2,b3:",b1.toString(16),b2.toString(16),b3.toString(16))
        let expectIncentive = b1

        expectIncentive = expectIncentive.add(b2)
        expectIncentive = expectIncentive.add(b3)
        console.log("realIncentive:",realIncentive.toString(16),"expectIncentive:",expectIncentive.toString(16))
        if(expectIncentive.cmp(realIncentive) != 0) {
            console.log("XXXXXXXXXXXXXXXX error XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        }
    })
}


async function mainLoopAsync() {
    log.info("\nMain loop begins...Wait");
    let last = 200
    let lastEpochID = 0
    Init()
    while(true) {
        let cur = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
        if(last == cur ){
            await pu.sleep(1000)
            continue
        }
        let block = await getBlock(last+1)
        calBlock(block)
        if(lastEpochID != block.epochID) {
            Incentived = false
            lastEpochID = block.epochID
        }
        if(Number(block.slotID) > 2*K && Number(block.slotID) < 3*K && (!Incentived)) {
            check(block.epochID-1, last,block)
        }


        last += 1
    }

}
