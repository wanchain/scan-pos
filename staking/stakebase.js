'use strict'

let CoinNodeObj = require('../conf/coinNodeObj.js')
const pu = require("promisefy-util")
const bn = require('bignumber.js')
let log = console
let web3Instance = new CoinNodeObj(log, 'wan');
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
            },
            {
                "name": "maxFeeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeRegister",
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
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            },
            {
                "name": "feeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeUpdateFeeRate",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "v",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "feeRate",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "lockEpoch",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "maxFeeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeRegister",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "v",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "feeRate",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "lockEpoch",
                "type": "uint256"
            }
        ],
        "name": "stakeIn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "v",
                "type": "uint256"
            }
        ],
        "name": "stakeAppend",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "lockEpoch",
                "type": "uint256"
            }
        ],
        "name": "stakeUpdate",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "v",
                "type": "uint256"
            },
            {
                "indexed": false,
                "name": "renewal",
                "type": "bool"
            }
        ],
        "name": "partnerIn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "v",
                "type": "uint256"
            }
        ],
        "name": "delegateIn",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            }
        ],
        "name": "delegateOut",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "posAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "feeRate",
                "type": "uint256"
            }
        ],
        "name": "stakeUpdateFeeRate",
        "type": "event"
    }
]

let contractDef = web3.eth.contract(cscDefinition);
let cscContractAddr = "0x00000000000000000000000000000000000000da";
let coinContract = contractDef.at(cscContractAddr);

async function sendStakeTransaction(txValue, txPayload,from) {
    if(!from){
        from = _coinbase
    }
    let txhash = await pu.promisefy(web3.personal.sendTransaction, [{
        from: from,
        to: cscContractAddr,
        value: '0x'+web3.toWei(web3.toBigNumber(txValue)).toString(16),
        data: txPayload,
        gas: 200000,
        gasprice: '0x' + (200000000000).toString(16)
    }, passwd], web3.personal);
    console.log("sendStakeTransaction txhash:", txhash)
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
    staker.votingPower = web3.toBigNumber(staker.votingPower)
    for(let i=0; i<staker.partners.length; i++) {
        staker.partners[i].amount = web3.toBigNumber(staker.partners[i].amount)
        staker.partners[i].votingPower = web3.toBigNumber(staker.partners[i].votingPower)
    }
    for(let i=0; i<staker.clients.length; i++) {
        staker.clients[i].amount = web3.toBigNumber(staker.clients[i].amount)
        staker.clients[i].votingPower = web3.toBigNumber(staker.clients[i].votingPower)
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
        if (item.name == funcName && item.type == "event") {
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
            assert(stakers[i].votingPower == staker.votingPower, "getEpochStakerInfo failed")
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
    let ret = await pu.promisefy(web3.personal.sendTransaction, [{from: _coinbase, to: addr, value: web3.toWei(1)}, passwd], web3.eth)
    log.info("send gasfee:", ret)
    return addr
}
async function Init() {
    //_coinbase = await pu.promisefy(web3.eth.getCoinbase, [], web3.eth)
    _coinbase = "0x2d0e7c0813a51d3bd1d08246af2a8a7a57d8922e"
    //_coinbase = "0xbd100cf8286136659a7d63a38a154e28dbf3e0fd"
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
async function stakeUpdate(t){
    // update validator
    let payload = coinContract.stakeUpdate.getData(t.validatorAddr, t.lockTime)
    let txhash = await sendStakeTransaction(0, payload)

    log.info("stakeUpdate tx:", txhash)
    let rec = await checkTxResult(txhash)
    assert(rec.status == '0x1', "stakeUpdate failed")
}
async function stakeInNew(t) {
    let newAddr = await newAccount();
    let pubs = await pu.promisefy(web3.personal.showPublicKey, [newAddr, passwd], web3.personal)
    let secpub = pubs[0]
    let g1pub = pubs[1]
    let contractDef = web3.eth.contract(cscDefinition);
    let coinContract = contractDef.at(cscContractAddr);
    let payload = coinContract.stakeIn.getData(secpub, g1pub, t.lockTime, t.feeRate)
    let txhash = await sendStakeTransaction(t.tranValue, payload)
    let rec = await checkTxResult(txhash)
    assert(rec.status == '0x1', "stakeInNew failed")
    return newAddr
}

module.exports.cscDefinition = cscDefinition
module.exports.waitReceipt = waitReceipt
module.exports.sendStakeTransaction = sendStakeTransaction
module.exports.Init = Init
module.exports.coinbase = coinbase

module.exports.coinContract = coinContract

module.exports.passwd = passwd
module.exports.checkTxResult = checkTxResult
module.exports.stakeInNew = stakeInNew
module.exports.stakeUpdate = stakeUpdate


module.exports.getEpochStakerInfo = getEpochStakerInfo
module.exports.getStakeInfobyAddr = getStakeInfobyAddr
module.exports.getWeight = getWeight
module.exports.minEpoch = 7
module.exports.getEventHash = getEventHash
module.exports.newAccount = newAccount
