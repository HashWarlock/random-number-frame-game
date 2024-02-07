export async function relayGas(syndicateAccessToken: string, recipientAddress: string, value: string) {
    const options = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + `${syndicateAccessToken}`,
            'Content-Type': 'application/json',
        },
        body:
            `{
              'projectId': '61ea8e4f-a202-48b6-9b3e-552dc560c852',
              'contractAddress': '0xacd6f8c64c902a8038f78fea2c939e2457e3e064',
              'chainId': 84532,
              'functionSignature': 'airdropERC20(address _tokenAddress, address _tokenOwner, (address recipient, uint256 amount)[] _contents)',
              'args': {
                  '_tokenAddress': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                  '_tokenOwner': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
                  [
                    { 'recipient': '${recipientAddress}', 'amount': '${value}' }
                  ],
              },
              'value': '${value}'
            }`,
    };

    const relayGasResponse = await fetch(
        'https://staging-api.syndicate.io/transact/sendTransactionWithValue',
        options
    );

    console.log('Relay gas response');
    if (relayGasResponse.ok) {
        const relayGasResponseJson = await relayGasResponse.json();
        console.log(relayGasResponseJson);
        return relayGasResponseJson.transactionId;
    } else {
        const relayGasResponseStatus = await relayGasResponse.status;
        console.log('Relay gas failed: ' + relayGasResponseStatus);
        return null;
    }
}
