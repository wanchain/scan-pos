module.exports = {
  extend: (web3) => {
    function insertMethod(name, call, params, inputFormatter, outputFormatter) {
      return new web3._extend.Method({ name, call, params, inputFormatter, outputFormatter });
    }

    function insertProperty(name, getter, outputFormatter) {
      return new web3._extend.Property({ name, getter, outputFormatter });
    }

    // eth
    web3._extend({
      property: 'eth',
      methods:
        [
          insertMethod('getRawTransaction', 'eth_getRawTransactionByHash', 1, [null], null)
        ],
      properties:
        [],
    });

    // txpool
    web3._extend({
      property: 'txpool',
      methods: [
        insertMethod('status', 'txpool_status', 0, null, null)
      ],
      properties:
          [
          ]
    });

    web3._extend({
      property: 'personal',
      methods:
          [
            insertMethod('showPublicKey', 'personal_showPublicKey', 2, [null,null], null)
          ],
      properties:
          [],
    });

    //POS

    web3._extend({
      property: 'pos',
      methods: [
        new web3._extend.Method({
          name: 'version',
          call: 'pos_version',
          params: 0
        }),
    
        new web3._extend.Method({
          name: 'getSlotLeadersByEpochID',
          call: 'pos_getSlotLeadersByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getEpochLeadersByEpochID',
          call: 'pos_getEpochLeadersByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getEpochLeadersAddrByEpochID',
          call: 'pos_getEpochLeadersAddrByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getLeaderGroupByEpochID',
          call: 'pos_getLeaderGroupByEpochID',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getSmaByEpochID',
          call: 'pos_getSmaByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getRandomProposersByEpochID',
          call: 'pos_getRandomProposersByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getRandomProposersAddrByEpochID',
          call: 'pos_getRandomProposersAddrByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getSlotScCallTimesByEpochID',
          call: 'pos_getSlotScCallTimesByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getSlotCreateStatusByEpochID',
          call: 'pos_getSlotCreateStatusByEpochID',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getRandom',
          call: 'pos_getRandom',
          params: 2
        }),
        new web3._extend.Method({
          name: 'getRbSignatureCount',
          call: 'pos_getRbSignatureCount',
          params: 2
        }),
        new web3._extend.Method({
          name: 'getChainQuality',
          call: 'pos_getChainQuality',
          params: 2
        }),
        new web3._extend.Method({
          name: 'getReorgState',
          call: 'pos_getReorgState',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getPosInfo',
          call: 'pos_getPosInfo',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getEpochStakerInfo',
          call: 'pos_getEpochStakerInfo',
          params: 2
        }),
        new web3._extend.Method({
          name: 'getEpochStakerInfoAll',
          call: 'pos_getEpochStakerInfoAll',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getLocalPK',
          call: 'pos_getLocalPK',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getBootNodePK',
          call: 'pos_getBootNodePK',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getWhiteListConfig',
          call: 'pos_getWhiteListConfig',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getWhiteListbyEpochID',
          call: 'pos_getWhiteListbyEpochID',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getEpochIncentivePayDetail',
          call: 'pos_getEpochIncentivePayDetail',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getTotalIncentive',
          call: 'pos_getTotalIncentive',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getEpochIncentive',
          call: 'pos_getEpochIncentive',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getEpochRemain',
          call: 'pos_getEpochRemain',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getTotalRemain',
          call: 'pos_getTotalRemain',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getIncentiveRunTimes',
          call: 'pos_getIncentiveRunTimes',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getEpochGasPool',
          call: 'pos_getEpochGasPool',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getStakerInfo',
          call: 'pos_getStakerInfo',
          params: 1,
                outputFormatter: function(stakers) {
                    for(var i=0; i<stakers.length; i++) {
                        stakers[i].stakeAmount = web3._extend.utils.toBigNumber(stakers[i].stakeAmount)
                        stakers[i].amount = web3._extend.utils.toBigNumber(stakers[i].amount)
                        for(var k=0; k<stakers[i].clients.length; k++) {
                            stakers[i].clients[k].stakeAmount = web3._extend.utils.toBigNumber(stakers[i].clients[k].stakeAmount)
                            stakers[i].clients[k].amount = web3._extend.utils.toBigNumber(stakers[i].clients[k].amount)
                        }
                        for(var k=0; k<stakers[i].partners.length; k++) {
                            stakers[i].partners[k].stakeAmount = web3._extend.utils.toBigNumber(stakers[i].partners[k].stakeAmount)
                            stakers[i].partners[k].amount = web3._extend.utils.toBigNumber(stakers[i].partners[k].amount)
                        }
                    }
                    return stakers
                }
        }),
        new web3._extend.Method({
          name: 'getRBAddress',
          call: 'pos_getRBAddress',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getIncentivePool',
          call: 'pos_getIncentivePool',
          params: 1
        }),
    
        new web3._extend.Method({
          name: 'getActivity',
          call: 'pos_getActivity',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getEpochID',
          call: 'pos_getEpochID',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getSlotID',
          call: 'pos_getSlotID',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getSlotCount',
          call: 'pos_getSlotCount',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getSlotTime',
          call: 'pos_getSlotTime',
          params: 0
        }),
        new web3._extend.Method({
          name: 'getMaxStableBlkNumber',
          call: 'pos_getMaxStableBlkNumber',
          params: 0
        }),
        new web3._extend.Method({
          name: 'calProbability',
          call: 'pos_calProbability',
          params: 2
        }),
        new web3._extend.Method({
          name: 'getEpochIDByTime',
          call: 'pos_getEpochIDByTime',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getSlotIDByTime',
          call: 'pos_getSlotIDByTime',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getTimeByEpochID',
          call: 'pos_getTimeByEpochID',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getEpochBlkCnt',
          call: 'pos_getEpochBlkCnt',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getValidSMACnt',
          call: 'pos_getValidSMACnt',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getSlStage',
          call: 'pos_getSlStage',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getValidRBCnt',
          call: 'pos_getValidRBCnt',
          params: 1
        }),
        new web3._extend.Method({
          name: 'getRbStage',
          call: 'pos_getRbStage',
          params: 1
        }),
      ]
    });
  },
};
