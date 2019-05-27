'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wanipc');
let web3 = web3Instance.getClient()
const assert = require('assert');
let _coinbase;

let passwd = "wanglu"


const cscDefinition = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "stakeAppend",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            },
            {
                "name": "lockEpochs",
                "type": "uint256"
            }
        ],
        "name": "stakeUpdate",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "secPk",
                "type": "bytes"
            },
            {
                "name": "bn256Pk",
                "type": "bytes"
            },
            {
                "name": "lockEpochs",
                "type": "uint256"
            },
            {
                "name": "feeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            },
            {
                "name": "renewal",
                "type": "bool"
            }
        ],
        "name": "partnerIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "delegateAddress",
                "type": "address"
            }
        ],
        "name": "delegateIn",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "delegateAddress",
                "type": "address"
            }
        ],
        "name": "delegateOut",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

let contractDef = web3.eth.contract(cscDefinition);
let cscContractAddr = "0x00000000000000000000000000000000000000d2";
let coinContract = contractDef.at(cscContractAddr);

async function sendStakeTransaction(txValue, txPayload) {
    let txhash = await pu.promisefy(web3.eth.sendTransaction, [{
        from: _coinbase,
        to: cscContractAddr,
        value: '0x'+web3.toWei(web3.toBigNumber(txValue)).toString(16),
        data: txPayload,
        gas: 200000,
        gasprice: '0x' + (200000000000).toString(16)
    }], web3.eth);
    return txhash;
}
async function waitReceipt(txhash) {
    let lastBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
    let newBlock = lastBlock
    while(newBlock - lastBlock < 4) {
        await pu.sleep(1000)
        newBlock = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
        if( newBlock != lastBlock) {
            let rec = await pu.promisefy(web3.eth.getTransactionReceipt, [txhash], web3.eth)
            if ( rec ) {
                return rec
            }
        }
    }
    return null
}

function stakerConver(staker) {
    staker.amount = web3.toBigNumber(staker.amount)
    staker.stakeAmount = web3.toBigNumber(staker.stakeAmount)
    for(let i=0; i<staker.partners.length; i++) {
        staker.partners[i].amount = web3.toBigNumber(staker.partners[i].amount)
        staker.partners[i].stakeAmount = web3.toBigNumber(staker.partners[i].stakeAmount)
    }
    for(let i=0; i<staker.clients.length; i++) {
        staker.clients[i].amount = web3.toBigNumber(staker.clients[i].amount)
        staker.clients[i].stakeAmount = web3.toBigNumber(staker.clients[i].stakeAmount)
    }
}

async function getStakeInfobyAddr(newAddr) {
    let cur = await pu.promisefy(web3.eth.getBlockNumber, [], web3.eth)
    //console.log("cur:", cur)
    let stakers = await pu.promisefy(web3.pos.getStakerInfo,[cur], web3.pos)
    //console.log("stakers:", stakers)
    for(let i=0; i<stakers.length; i++) {
        if(newAddr == stakers[i].address) {
            stakerConver(stakers[i])
            return stakers[i]
        }
    }
    return null
}

function getEventHash(eventName, contractAbi) {
    return web3.sha3(getcommandString(eventName, contractAbi)).toString('hex');
}

function getcommandString(funcName, contractAbi) {
    for (var i = 0; i < contractAbi.length; ++i) {
        let item = contractAbi[i];
        if (item.name == funcName) {
            let command = funcName + '(';
            for (var j = 0; j < item.inputs.length; ++j) {
                if (j != 0) {
                    command = command + ',';
                }
                command = command + item.inputs[j].type;
            }
            command = command + ')';
            return command;
        }
    }
}


async function getEpochStakerInfo(epochID, addr) {
    console.log("getEpochStakerInfo: ", epochID, addr)
    let staker = await pu.promisefy(web3.pos.getEpochStakerInfo,[epochID, addr], web3.pos)
    //console.log(staker)
    let stakers = await pu.promisefy(web3.pos.getEpochStakerInfoAll,[epochID], web3.pos)
    //console.log(stakers)

    for(let i=0; i<stakers.length; i++) {
        if(stakers[i].Address == staker.Address){
            assert(stakers[i].address == staker.address, "getEpochStakerInfo failed")
            assert(stakers[i].amount == staker.amount, "getEpochStakerInfo failed")
            assert(stakers[i].stakeAmount == staker.stakeAmount, "getEpochStakerInfo failed")
        }
    }
    return staker
}
function getWeight(epoch){
    return 960+6*epoch
}
async function newAccount() {
    let addr = await pu.promisefy(web3.personal.newAccount, [passwd], web3.personal)
    log.info("newAccount: ", addr)
    // for pos trsaction gas fee
    let ret = await pu.promisefy(web3.eth.sendTransaction, [{from: _coinbase, to: addr, value: web3.toWei(1)}], web3.eth)
    log.info("send gasfee:", ret)
    return addr
}
async function Init() {
    _coinbase = await pu.promisefy(web3.eth.getCoinbase, [], web3.eth)
    console.log("coinbase: ", _coinbase)
}
function  coinbase() {
    return _coinbase
}
async function checkTxResult(txhash) {
    let rec = await waitReceipt(txhash)
    //log.info("tx ",txhash, "receipt: ", rec)
    assert(rec != null, "Can't get receipt of "+txhash)
    return rec
}
module.exports.cscDefinition = cscDefinition
module.exports.waitReceipt = waitReceipt
module.exports.sendStakeTransaction = sendStakeTransaction
module.exports.Init = Init
module.exports.coinbase = coinbase

module.exports.coinContract = coinContract

module.exports.passwd = passwd
module.exports.checkTxResult = checkTxResult

module.exports.getEpochStakerInfo = getEpochStakerInfo
module.exports.getStakeInfobyAddr = getStakeInfobyAddr
module.exports.getWeight = getWeight
module.exports.minEpoch = 7
module.exports.getEventHash = getEventHash
module.exports.newAccount = newAccount
