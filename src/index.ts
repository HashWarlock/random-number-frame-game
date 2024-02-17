import {FrameRequest, FrameValidationData} from '@coinbase/onchainkit'
import {getFrameMetadata} from '@coinbase/onchainkit/dist/lib/core/getFrameMetadata'
import {getFrameMessage} from '@coinbase/onchainkit/dist/lib/core/getFrameMessage'
import {renderOpenGraph, Request, Response, route} from './frameSupport'
import {getCreateYourNewGame, getGuessHistorySVG, getScenarioNumber, homeFrameSVG, Scenario} from "./utils/getImage";
import {
    getGameId,
    getGameStatus,
    getPlayerGuessHistory,
    insertGuess,
    updateGameStatus,
    updatePlayerCount
} from "./db/supabase";
import {createNewGame} from "./utils/createNewGame";
import {relayPayout} from "./aa/syndicate";

const BASE_URL = 'https://frames.phatfn.xyz'

async function GET(req: Request): Promise<Response> {
    if (req.queries?.home) {
        return homeFrameSVG(req);
    } else if (req.queries?.getHistory){
        return getGuessHistorySVG(req);
    } else if (req.queries?.createGame) {
        return getCreateYourNewGame(req);
    } else {
        return getHomeFrame(req);
    }
}

async function getHomeFrame(req: Request): Promise<Response> {
    const secret = req.queries?.key ?? '';
    let gameId = req.queries?.gameId;
    if (!gameId) {
        const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
        const newGameId = await getGameId(`${supabaseApiKey}`, secret[0]);
        console.log(newGameId[0])
        gameId = [`${newGameId[0].id}`];
    }
    let homeImage = '?home=true';
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `🎮 Play`,
            },
        ],
        image: BASE_URL + req.path + homeImage,
        postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&play=${Math.random()}`,
    });

    return new Response(renderOpenGraph({
            title: BASE_URL + req.path,
            description: 'FrameHub',
            openGraph: {
                title: BASE_URL + req.path,
                description: 'FrameHub',
                images: [BASE_URL + req.path + homeImage],
            },
            other: {
                ...frameMetadata,
            },
        }),
        { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function getGuessResponse(req: Request, message: FrameValidationData | undefined): Promise<Response> {
    let username: string | undefined = '';
    let evmAccount: string | undefined = '';
    let answer: string | undefined = 'Guess a Number';
    const secret = req.queries?.key ?? '';
    const gameId = req.queries?.gameId;
    let imageRender = `${BASE_URL}${req.path}?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`;
    const syndicateAccount = req.secret?.syndicateAccount ?? '';
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    const randomNumber = req.secret?.randomNumber;
    let svgGuessText = '';
    const gameStatus = await getGameStatus(`${supabaseApiKey}`, gameId[0]);

    if (gameStatus[0].active && message) {
        evmAccount = message.interactor.verified_accounts[0];
        username = message.raw.action.interactor.username ?? `fc_id:${message.raw.action.interactor.fid}`;
        // @ts-ignore
        const numberOfPlayerGuesses = await getPlayerGuessHistory(`${supabaseApiKey}`, gameId[0], username);
        answer = message.input;
        let isWinner = false;
        if ((message.following && message.liked && message.recasted && numberOfPlayerGuesses.length < 2) || numberOfPlayerGuesses.length < 1) {
            const answerNum = Number(answer);
            if (!evmAccount) {
                imageRender += `&scenario=${getScenarioNumber(Scenario.Invalid)}&invalidGuess=${username}%20missing%20verified%20EVM%20Account.`;
            } else if (isNaN(answerNum)) {
                imageRender += `&scenario=${getScenarioNumber(Scenario.Invalid)}&invalidGuess=${username}%20guessed%20NaN.%20Guess%20again.`;
            } else if (answerNum == Number(randomNumber)) {
                svgGuessText = `guessed ${answerNum}. BINGO!`;
                await relayPayout(`${syndicateAccount}`, `${evmAccount}`);
                isWinner = true;
                await insertGuess(`${supabaseApiKey}`, username, svgGuessText, isWinner, gameId[0]);
            } else {
                if (answerNum > Number(randomNumber)) {
                    svgGuessText = `guessed ${answerNum}, but too high.`
                } else {
                    svgGuessText = `guessed ${answerNum}, but too low.`
                }
                imageRender += `&scenario=${getScenarioNumber(Scenario.GuessHistory)}`
                await insertGuess(`${supabaseApiKey}`, username, svgGuessText, isWinner, gameId[0]);
            }
            if (numberOfPlayerGuesses.length < 1) {
                await updatePlayerCount(`${supabaseApiKey}`, gameId[0]);
            }
            if (isWinner) {
                imageRender += `&scenario=${getScenarioNumber(Scenario.GameOver)}`
                await updateGameStatus(`${supabaseApiKey}`, gameId[0], false);
            }
        } else if (numberOfPlayerGuesses.length == 1) {
            if (!(message.following && message.liked && message.recasted)) {
                imageRender += `&scenario=${getScenarioNumber(Scenario.Tip)}&following=${message.following}&liked=${message.liked}&recasted=${message.recasted}`;
            }
        } else if (numberOfPlayerGuesses.length > 1) {
            imageRender += `&scenario=${getScenarioNumber(Scenario.Invalid)}&invalidGuess=${username}%20is%20out%20of%20guesses.`
        }
    }
    let frameMetadata;
    let buttons = [
        {
            label: '📜 Rules'
        },
        {
            label: 'Create Your Game',
        },
    ];
    if (gameStatus[0].active) {
        buttons.push({
            label: '🤔 Guess',
        },);
        frameMetadata = getFrameMetadata({
            buttons: buttons,
            image: `${imageRender}`,
            postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
            input: { text: answer },
        });
    } else {
        frameMetadata = getFrameMetadata({
            buttons: buttons,
            image: `${imageRender}`,
            postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
        });
    }

    return new Response(renderOpenGraph({
          title: BASE_URL + req.path,
          description: 'FrameHub',
          openGraph: {
              title: BASE_URL + req.path,
              description: 'FrameHub',
              images: [`${imageRender}`],
          },
          other: {
              ...frameMetadata,
          },
      }),
      { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function getPlayHistory(req: Request, image: string): Promise<Response> {
    let answer: string | undefined = 'Guess a Number';
    const secret = req.queries?.key ?? '';
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    const gameId = req.queries?.gameId ?? '';
    const gameStatus = await getGameStatus(supabaseApiKey, gameId[0]);
    let frameMetadata;
    let buttons = [
        {
            label: '📜 Rules'
        },
        {
            label: 'Create Your Game',
        },
    ];
    if (gameStatus[0].active) {
        buttons.push({
            label: '🤔 Guess',
        },);
        frameMetadata = getFrameMetadata({
            buttons: buttons,
            image: `${image}`,
            postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
            input: { text: answer },
        });
    } else {
        frameMetadata = getFrameMetadata({
            buttons: buttons,
            image: `${image}`,
            postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
        });
    }

    return new Response(renderOpenGraph({
            title: BASE_URL + req.path,
            description: 'FrameHub',
            openGraph: {
                title: BASE_URL + req.path,
                description: 'FrameHub',
                images: [`${image}`],
            },
            other: {
                ...frameMetadata,
            },
        }),
        { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function getCreateGame(req: Request, username: string): Promise<Response> {
    const secret = req.queries?.key ?? '';
    const gameId = req.queries?.gameId ?? ''
    let newGameId = gameId;
    const path = req.path;
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    const cid = path.replace('/ipfs/', '');
    // console.log(`cid: ${cid}`);
    const newKey = await createNewGame(cid, secret[0], `${supabaseApiKey}`, username);
    // console.log(newKey)
    if (newKey !== '0') {
        const newGameIdResponse = await getGameId(`${supabaseApiKey}`, newKey);
        // console.log(newGameIdResponse);
        // @ts-ignore
        newGameId = newGameIdResponse[0].id;
    }
    let createGameImage = '?createGame=true';
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: '⬅️ Back',
            },
            {
                label: '🚀 Confirm',
                action: 'link',
                target: 'https://warpcast.com/~/compose?text=Deployed%20via%20FrameHub&embeds[]=farcaster://profiles/263870&embeds[]=' + BASE_URL + req.path + '?key=' + newKey + '&gameId=' + newGameId
            },
        ],
        image: BASE_URL + req.path + createGameImage,
        postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&back=${Math.random()}`,
    });

    return new Response(renderOpenGraph({
          title: BASE_URL + req.path,
          description: 'FrameHub',
          openGraph: {
              title: BASE_URL + req.path,
              description: 'FrameHub',
              images: [BASE_URL + req.path + createGameImage],
          },
          other: {
              ...frameMetadata,
          },
      }),
      { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } }
    );
}
async function POST(req: any): Promise<Response> {
    const secret = req.queries?.key ?? '';
    const gameId = req.queries?.gameId;
    let image = `${BASE_URL}${req.path}?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`;
    if (req.queries?.play) {
        return getPlayHistory(req, image);
    } else if (req.queries?.getHistory) {
        const body: FrameRequest = await req.json();
        const apiKey = req.secret?.apiKey ?? 'NEYNAR_API';
        const { isValid, message } = await getFrameMessage(body, { neynarApiKey: `${apiKey}`});
        if (!isValid) {
            return getPlayHistory(req, image);
        } else {
            const buttonIndex = message?.button;
            if (buttonIndex == 1) {
                if (!req.queries?.back) {
                    image += '&rules=true&scenario=' + getScenarioNumber(Scenario.Rules);
                }
                return getPlayHistory(req, image);
            } else {
                if (buttonIndex == 2) {
                    if (!(message.following && message.liked && message.recasted)) {
                        image += `&scenario=${getScenarioNumber(Scenario.Tip)}&following=${message.following}&liked=${message.liked}&recasted=${message.recasted}`;
                        return getPlayHistory(req, image);
                    }
                    const username = message.raw.action.interactor.username ?? `fc_id:${message.raw.action.interactor.fid}`;
                    return getCreateGame(req, username);
                } else if (buttonIndex == 3) {
                    return getGuessResponse(req, message);
                } else {
                    return getPlayHistory(req, image);
                }
            }
        }
    } else {
        return getPlayHistory(req, image);
    }
}

export default async function main(request: string) {
    return await route({GET, POST}, request)
}
