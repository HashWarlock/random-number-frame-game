import {getRandomNumber} from "./getRandomNumber";
import {insertNewGame} from "../db/supabase";

export async function createNewGame(cid: string, key: string, supabaseApiKey: string, username: string){
  const newRandomNumber = getRandomNumber(1000);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: `{"cid":"${cid}","data":{"randomNumber":"${newRandomNumber}"},"inherit":"${key}"}`,
  };

  const response = await fetch(
    'https://frames.phatfn.xyz/vaults',
    options
  );

  if (response) {
    const responseBody = await response.json();
    // console.log(responseBody);
    const newKey = responseBody.key;
    await insertNewGame(supabaseApiKey, username, newKey);
    return newKey;
  } else {
    return '0';
  }
}
