export async function relayGas(syndicateAccessToken: string, recipientAddress: string) {
    const options = {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + syndicateAccessToken,
            'Content-Type': 'application/json',
        },
        body:
            '{"projectId":"61ea8e4f-a202-48b6-9b3e-552dc560c852","contractAddress":"0x6E45e26D546E25F13b36CE900c4758EE59E78185","chainId": 84532,"functionSignature": "withdraw(address to)","args":{"to":"'+ recipientAddress +'"}}',
    };

    await fetch('https://api.syndicate.io/transact/sendTransaction', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}
