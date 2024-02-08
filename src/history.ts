export async function insertGuess(supabaseApiKey: string, guessText: string, winner: boolean) {
    const options = {
        method: 'POST',
        headers: {
            'apikey': `${supabaseApiKey}`,
            'Authorization': `Bearer ${supabaseApiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: `{"guess_text": "${guessText}", "winner": ${winner}}`,
    };

    await fetch(
        'https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/RandomNumberGuesses',
        options
    );
}

export async function getGameStatus(supabaseApiKey: string) {
    const options = {
        method: 'GET',
        headers: {
            'apikey': `${supabaseApiKey}`,
            'Authorization': `Bearer ${supabaseApiKey}`,
        },
    };
    const gameStatusResponse = await fetch(
        'https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/RandomNumberGuesses?winner=eq.true&select=*',
        options
    );
    // @ts-ignore
    const gameStatusResponseJson = await gameStatusResponse.json();
    console.log(gameStatusResponseJson);
    const gameStatusArray = gameStatusResponseJson;
    if (gameStatusArray.length) {
        return gameStatusArray[0].winner
    } else {
        return false;
    }
}
