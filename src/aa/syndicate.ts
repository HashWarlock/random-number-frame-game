export async function relayPayout(syndicateAccessToken: string, recipientAddress: string) {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + syndicateAccessToken,
      'Content-Type': 'application/json',
    },
    body:
      '{"projectId":"6c47a807-ee73-4c78-ae66-d9ef92f13c76","contractAddress":"0xa5a2a8f968Cd22524b82056F1b767fA105C2C37C","chainId": 8453,"functionSignature": "forwardERC20Token(address recipient, uint256 amount)","args":{"recipient":"'+ recipientAddress +'", "amount":10000000000000000}}',
  };

  await fetch('https://api.syndicate.io/transact/sendTransaction', options)
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(err => console.error(err));
}
