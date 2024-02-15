import {FrameRequest, FrameValidationData} from '@coinbase/onchainkit'
import { getFrameMetadata } from '@coinbase/onchainkit/dist/lib/core/getFrameMetadata'
import { getFrameMessage } from '@coinbase/onchainkit/dist/lib/core/getFrameMessage'
import {Request, Response, renderOpenGraph, route} from './frameSupport'
import {homeFrameSVG, getGuessHistorySVG} from "./utils/getImage";
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
    } else {
        return getHomeFrame(req);
    }
}

async function getHomeFrame(req: Request): Promise<Response> {
    const secret = req.queries?.key ?? '';
    const gameId = req.queries?.gameId ?? ''
    let homeImage = '?home=true';
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `Play`,
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
    const imageRender = `${BASE_URL}${req.path}?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`;
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
        if (message.following && message.liked && message.recasted) {
            const answerNum = Number(answer);
            if (!evmAccount) {
                svgGuessText = `${username} missing EVM Account`;
            } else if (isNaN(answerNum)) {
                svgGuessText = `${username} guessed NaN`;
            } else if (answerNum == Number(randomNumber)) {
                svgGuessText = `guessed ${answerNum}. BINGO!`;
                await relayPayout(`${syndicateAccount}`, `${evmAccount}`);
                isWinner = true;
            } else { // @ts-ignore
                if (answerNum > Number(randomNumber)) {
                    svgGuessText = `guessed ${answerNum}, but too high.`
                } else {
                    svgGuessText = `guessed ${answerNum}, but too low.`
                }
            }
            if (numberOfPlayerGuesses.length < 1) {
                await updatePlayerCount(`${supabaseApiKey}`, gameId[0]);
            }
            // @ts-ignore
            await insertGuess(`${supabaseApiKey}`, username, svgGuessText, isWinner, gameId[0]);
            if (isWinner) {
                await updateGameStatus(`${supabaseApiKey}`, gameId[0], false);
            }
        }
    }
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: 'Guess',
            },
            {
                label: 'Create a Game',
            },
        ],
        image: `${imageRender}`,
        postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
        input: { text: answer },
    });

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
    const gameId = req.queries?.gameId;

    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: 'Guess',
            },
            {
                label: 'Create a Game',
            },
        ],
        image: `${image}`,
        postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`,
        input: { text: answer },
    });

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
    let homeImage = '?home=true';
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: '⬅️ Back',
            },
            {
                label: 'Deploy New Game',
                action: 'link',
                target: 'https://warpcast.com/~/compose?text=Deployed%20via%20@framehub&embeds[]=' + BASE_URL + req.path + `?key=${newKey}&gameId=${newGameId}`
            },
        ],
        image: BASE_URL + req.path + homeImage,
        postUrl: BASE_URL + req.path + `?key=${secret[0]}&gameId=${gameId[0]}&createGame=${Math.random()}`,
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
async function POST(req: any): Promise<Response> {
    const secret = req.queries?.key ?? '';
    const gameId = req.queries?.gameId;
    const image = `${BASE_URL}${req.path}?key=${secret[0]}&gameId=${gameId[0]}&getHistory=${Math.random()}`;
    if (req.queries?.play) {
        return getPlayHistory(req, image);
    } else if (req.queries?.getHistory) {
        const body: FrameRequest = await req.json();
        const apiKey = req.secret?.apiKey ?? 'NEYNAR_API';
        const { isValid, message } = await getFrameMessage(body, { neynarApiKey: `${apiKey}`});
        if (!isValid || !(message.following && message.liked && message.recasted)) {
            return getPlayHistory(req, image);
        } else {
            const buttonIndex = message?.button;
            if (buttonIndex == 1) {
                return getGuessResponse(req, message);
            } else if (buttonIndex == 2) {
                const username = message.raw.action.interactor.username ?? `fc_id:${message.raw.action.interactor.fid}`;
                return getCreateGame(req, username);
            } else {
                return getPlayHistory(req, image);
            }
        }
    } else {
        return getPlayHistory(req, image);
    }
}

export default async function main(request: string) {
    return await route({GET, POST}, request)
}
