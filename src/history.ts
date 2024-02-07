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
