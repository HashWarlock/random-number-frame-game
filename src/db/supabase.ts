export async function insertGuess(supabaseApiKey: string, username: string, guessText: string, isWinner: boolean, gameId: string) {
  const endTime = new Date();
  const formatEndTime = formatToTime(endTime.getUTCHours()) + ":" + formatToTime(endTime.getUTCMinutes()) + ":" + formatToTime(endTime.getUTCSeconds());
  console.log(formatEndTime);
  const options = {
    method: 'POST',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: `{"guess": "${guessText}", "is_winner": ${isWinner}, "created_at": "${formatEndTime}", "username": "${username}", "game_id": "${gameId}"}`,
  };

  await fetch(
    'https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGuesses',
    options
  );
}

function formatToTime(time: number) {
  return ('0' + time).slice(-2);
}

export async function updateGameStatus(supabaseApiKey: string, gameId: string, active: boolean) {
  const endTime = new Date();
  const formatEndTime = formatToTime(endTime.getUTCHours()) + ":" + formatToTime(endTime.getUTCMinutes()) + ":" + formatToTime(endTime.getUTCSeconds());
  console.log(formatEndTime);
  const options = {
    method: 'PATCH',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: `{"active": ${active}, "ended_at": "${formatEndTime}"}`,
  };

  await fetch(
    `https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGames?id=eq.${gameId}`,
    options
  );
}

export async function updatePlayerCount(supabaseApiKey: string, gameId: string) {
  const gameStatus = await getGameStatus(supabaseApiKey, gameId);
  console.log(`Game Status: ${gameStatus}`);
  const currentPlayerCount = gameStatus[0].player_count;
  const options = {
    method: 'PATCH',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: `{"player_count": "${currentPlayerCount + 1}"}`,
  };

  await fetch(
    `https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGames?id=eq.${gameId}`,
    options
  );
}

export async function getGameStatus(supabaseApiKey: unknown, gameId: string) {
  const options = {
    method: 'GET',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
    },
  };
  const gameStatusResponse = await fetch(
    `https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGames?id=eq.${gameId}`,
    options
  );
  // @ts-ignore
  const gameStatusResponseJson = await gameStatusResponse.json();
  console.log(gameStatusResponseJson);
  return gameStatusResponseJson;
}

export async function getGuessHistory(supabaseApiKey: unknown, gameId: string[] | string) {
  const options = {
    method: 'GET',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
    },
  };
  const guessHistoryResponse = await fetch(
    `https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGuesses?limit=9&game_id=eq.${gameId}&order=id.desc`,
    options
  );
  // @ts-ignore
  const guessHistoryResponseJson = await guessHistoryResponse.json();
  console.log(guessHistoryResponseJson);
  return guessHistoryResponseJson;
}

export async function getPlayerGuessHistory(supabaseApiKey: unknown, gameId: string, username: string) {
  const options = {
    method: 'GET',
    headers: {
      'apikey': `${supabaseApiKey}`,
      'Authorization': `Bearer ${supabaseApiKey}`,
    },
  };
  const playerGuessHistoryResponse = await fetch(
    `https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/GuessANumberGuesses?game_id=eq.${gameId}&username=eq.${username}`,
    options
  );
  // @ts-ignore
  const playerGuessHistoryResponseJson = await playerGuessHistoryResponse.json();
  console.log(playerGuessHistoryResponseJson);
  return playerGuessHistoryResponseJson;
}
