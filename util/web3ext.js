module.exports = {
  extend: (web3) => {
    function insertMethod(name, call, params, inputFormatter, outputFormatter) {
      return new web3._extend.Method({ name, call, params, inputFormatter, outputFormatter });
    }

    function insertProperty(name, getter, outputFormatter) {
      return new web3._extend.Property({ name, getter, outputFormatter });
    }

    web3._extend({
      property: 'eth',
      methods:
        [
          insertMethod('getRawTransaction', 'eth_getRawTransactionByHash', 1, [null], null)
        ],
      properties:
        [],
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
    web3._extend({
      property: 'pos',
      methods:
          [
            insertMethod('getStakerInfo', 'pos_getStakerInfo', 1, [null], function(stakers) {
              for(var i=0; i<stakers.length; i++) {
                stakers[i].StakeAmount = web3._extend.utils.toBigNumber(stakers[i].StakeAmount)
                stakers[i].Amount = web3._extend.utils.toBigNumber(stakers[i].Amount)
                for(var k=0; k<stakers[i].Clients.length; k++) {
                  stakers[i].Clients[k].StakeAmount = web3._extend.utils.toBigNumber(stakers[i].Clients[k].StakeAmount)
                  stakers[i].Clients[k].Amount = web3._extend.utils.toBigNumber(stakers[i].Clients[k].Amount)
                }
                for(var k=0; k<stakers[i].Partners.length; k++) {
                  stakers[i].Partners[k].StakeAmount = web3._extend.utils.toBigNumber(stakers[i].Partners[k].StakeAmount)
                  stakers[i].Partners[k].Amount = web3._extend.utils.toBigNumber(stakers[i].Partners[k].Amount)
                }
              }
              return stakers
            }),
            insertMethod('getEpochStakerInfoAll', 'pos_getEpochStakerInfoAll', 1, [null], null),
            insertMethod('getEpochStakerInfo', 'pos_getEpochStakerInfo', 2, [null,null], null)
          ],
      properties:
          [],
    });
    web3._extend({
      property: 'txpool',
      methods: [
        insertMethod('status', 'txpool_status', 0, null, null)
      ],
      properties:
          [
          ]
    });
  },
};
