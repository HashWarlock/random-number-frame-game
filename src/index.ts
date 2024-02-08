import { FrameRequest } from '@coinbase/onchainkit'
import { getFrameMetadata } from '@coinbase/onchainkit/dist/lib/core/getFrameMetadata'
import { getFrameMessage } from '@coinbase/onchainkit/dist/lib/core/getFrameMessage'
import {Request, Response, renderOpenGraph, route} from './frameSupport'
import {relayGas} from "./payout";
import {getGameStatus, insertGuess} from "./history";

const BASE_URL = 'https://frames.phatfn.xyz'

async function GET(req: Request): Promise<Response> {
    if (req.queries?.home) {
        return homeFrameSVG(req);
    } else if (req.queries?.guess) {
        return createSVGWithShapesAndNumber(req);
    } else if (req.queries?.getHistory) {
        return getGuessHistory(req);
    } else if (req.queries?.gameover) {
        return createSVGWithShapesAndNumber(req);
    } else {
        return getHomeFrame(req);
    }
}

async function getHomeFrame(req: Request): Promise<Response> {
    const secret = req.queries?.key ?? '';
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    let homeImage = '?home=true';
    if (await getGameStatus(`${supabaseApiKey}`)) {
        homeImage = '?gameover=true';
    }
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `Guess a Number`,
            },
            {
                label: `View History`,
            },
        ],
        image: BASE_URL + req.path + homeImage,
        post_url: BASE_URL + req.path + `?key=${secret[0]}`,
        input: {text: 'Guess a Number'}
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

async function getResponse(req: Request): Promise<Response> {
    let username: string | undefined = '';
    let evmAccount: string | undefined = '';
    let answer: string | undefined = 'Guess a Number';
    let buttonLabel: string | undefined = 'Guess a Number';
    let imageRender = `${BASE_URL}${req.path}`;
    const secret = req.queries?.key ?? ''
    const apiKey = req.secret?.apiKey ?? 'NEYNAR_API';
    const syndicateAccount = req.secret?.syndicateAccount ?? '';
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    const randomNumber = req.secret?.randomNumber;
    let svgGuessText = '';

    const body: FrameRequest = await req.json();

    const { isValid, message } = await getFrameMessage(body, { neynarApiKey: `${apiKey}`});

    if (isValid) {
        if (message.button == 1) {
            evmAccount = message.interactor.verified_accounts[0];
            username = message.raw.action.interactor.username ?? `fc_id: ${message.raw.action.interactor.fid}`;
            answer = message.input;
            const answerNum = Number(answer);
            if (!evmAccount) {
                buttonLabel = 'Missing EVM Account';
                svgGuessText = `${username} Missing EVM Account`;
            } else if (isNaN(answerNum)) {
                buttonLabel = 'Input NaN. Guess Again';
                svgGuessText = `${username}: Input NaN`;
            } else if (isNaN(Number(randomNumber))) {
                buttonLabel = 'No Random Number Set';
                svgGuessText = `${username}: No Random Number Set`;
            } else if (answerNum == Number(randomNumber)) {
                buttonLabel = `Correct! ${username}`;
                svgGuessText = `${username}: Guessed ${answerNum}. Winner! ETH Airdrop Sent!`;
                // TEST: Update to Account Address with Check After Fix
                await relayGas(`${syndicateAccount}`, `${evmAccount}`);
                await insertGuess(`${supabaseApiKey}`, svgGuessText, true);
            } else { // @ts-ignore
                if (answerNum > Number(randomNumber)) {
                    svgGuessText = `${username}: Guessed ${answerNum}. Too High!`
                } else {
                    svgGuessText = `${username}: Guessed ${answerNum}. Too Low!`
                }
                buttonLabel = `Incorrect! Guess Again`;
                await insertGuess(`${supabaseApiKey}`, svgGuessText, false)
            }
            imageRender = `${imageRender}?guess=${svgGuessText}`;
        } else {
            imageRender = `${imageRender}?key=${secret[0]}&getHistory=${Math.random()}`;
        }
    }
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `${buttonLabel}`,
            },
            {
                label: 'View History',
            },
        ],
        image: [`${imageRender}`],
        post_url: BASE_URL + req.path + `?key=${secret[0]}`,
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

async function homeFrameSVG(req: Request): Promise<Response> {
    const fontColor = '#cdfa50';
    const bgColor = '#000000';
    const svg =
        `<svg width="800" height="418" viewBox="0 0 800 418" xmlns="http://www.w3.org/2000/svg">
        <path id="Path" fill="${bgColor}" stroke="none" d="M 0 0 L 800 0 L 800 418 L 0 418 Z"/>
        <path id="path1" fill="${fontColor}" stroke="none" d="M 350 109 C 350 125.568542 336.568542 139 320 139 C 303.431458 139 290 125.568542 290 109 C 290 92.431458 303.431458 79 320 79 C 336.568542 79 350 92.431458 350 109 Z"/>
        <path id="path2" fill="${fontColor}" stroke="none" d="M 370 79 L 430 79 L 430 139 L 370 139 Z"/>
        <path id="path3" fill="${fontColor}" stroke="none" d="M 480 79 L 450 139 L 510 139 Z"/>
        <path id="path4" fill="${fontColor}" stroke="none" d="M 370 179 L 420 179 L 420 189 L 370 189 Z"/>
        <path id="path5" fill="${fontColor}" stroke="none" d="M 370 189 L 380 189 L 380 199 L 370 199 Z"/>
        <path id="path6" fill="${fontColor}" stroke="none" d="M 420 189 L 430 189 L 430 199 L 420 199 Z"/>
        <path id="path7" fill="${fontColor}" stroke="none" d="M 370 199 L 380 199 L 380 209 L 370 209 Z"/>
        <path id="path8" fill="${fontColor}" stroke="none" d="M 420 199 L 430 199 L 430 209 L 420 209 Z"/>
        <path id="path9" fill="${fontColor}" stroke="none" d="M 380 209 L 420 209 L 420 219 L 380 219 Z"/>
        <path id="path10" fill="${fontColor}" stroke="none" d="M 370 219 L 380 219 L 380 229 L 370 229 Z"/>
        <path id="path11" fill="${fontColor}" stroke="none" d="M 370 229 L 380 229 L 380 239 L 370 239 Z"/>
        <path id="path12" fill="${fontColor}" stroke="none" d="M 240 269 L 560 269 L 560 289 L 240 289 Z"/>
        <path id="path13" fill="${fontColor}" stroke="none" d="M 240 309 L 560 309 L 560 329 L 240 329 Z"/>
    </svg>`
    console.log(svg);
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

async function createSVGWithShapesAndNumber(req: Request): Promise<Response> {
    let guess: string[] | string = '';
    let fontSize = 45;
    let fontColor = '#cdfa50';
    const bgColor = '#000000';
    if (req.queries?.gameover) {
        guess = 'GAME OVER!';
        fontSize = 90;
        fontColor = '#e53e3e';
    } else {
        guess = req.queries?.guess ?? 'No Guess Detected'
    }
    const svg =
    `<svg width="1600" height="824" viewBox="0 0 1600 824" xmlns="http://www.w3.org/2000/svg">
        <path id="Path" fill="${bgColor}" stroke="none" d="M 0 0 L 1600 0 L 1600 800 L 0 800 Z"/>
        <path id="path1" fill="${fontColor}" stroke="none" d="M 675 150 C 675 191.421387 641.421387 225 600 225 C 558.578613 225 525 191.421387 525 150 C 525 108.578613 558.578613 75 600 75 C 641.421387 75 675 108.578613 675 150 Z"/>
        <path id="path2" fill="${fontColor}" stroke="none" d="M 725 75 L 875 75 L 875 225 L 725 225 Z"/>
        <path id="path3" fill="${fontColor}" stroke="none" d="M 1000 75 L 925 225 L 1075 225 Z"/>
        <text id="text1" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${fontColor}" font-size="${fontSize}" font-weight="bold" >${guess}</text>
        <path id="path4" fill="${fontColor}" stroke="none" d="M 400 550 L 1200 550 L 1200 600 L 400 600 Z"/>
        <path id="path5" fill="${fontColor}" stroke="none" d="M 400 650 L 1200 650 L 1200 700 L 400 700 Z"/>
    </svg>
  `;

    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

async function getGuessHistory(req: Request): Promise<Response> {
    const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
    const options = {
        method: 'GET',
        headers: {
            'apikey': `${supabaseApiKey}`,
            'Authorization': `Bearer ${supabaseApiKey}`,
        },
    };
    const guessHistoryResponse = await fetch(
        'https://hkmyqdjuazltuwcqkgnt.supabase.co/rest/v1/RandomNumberGuesses?select=*',
        options
    );
    // @ts-ignore
    const guessHistoryResponseJson = await guessHistoryResponse.json();
    console.log(guessHistoryResponseJson);
    const guessHistoryArray = guessHistoryResponseJson;
    const width = 1600;
    const height = 824;
    const columns = 3;
    const columnWidth = width / columns;
    const rowHeight = 40; // Adjust row height for readability
    const rows = height / rowHeight;
    const fontSize = 22; // Adjust font size for readability
    const fontColor = '#cdfa50';
    const bgColor = '#000000';
    const rowPad = 20;
    const title = 'User Guesses';

    let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 1600 824" xmlns="http://www.w3.org/2000/svg">\n\t<path id="Path" fill="${bgColor}" stroke="none" d="M 0 0 L 1600 0 L 1600 800 L 0 800 Z"/>\n`;
    svgContent += `\t<text id="title" x="50%" y="3.5%" dominant-baseline="middle" text-anchor="middle" fill="${fontColor}" font-size="30" font-weight="bold" >${title}</text>\n`;
    svgContent += `\t<rect x="0" y="6%" width="100%" height="1" fill="${fontColor}" />\n`;
    let index = 0;
    const guessHistoryLength = guessHistoryArray.length;
    for (let i = 0; i < columns; i++) {
        for (let j = 1; j < rows; j++) {
            if (index < guessHistoryLength) {
                const guessHistoryText = guessHistoryArray[index];
                console.log(guessHistoryText.winner);
                const x = i * columnWidth + rowPad;
                const y = (j + 1) * rowHeight;
                svgContent += `\t<text id="Text${index}" x="${x}" y="${y}" fill="${fontColor}" font-size="${fontSize}" font-weight="bold" >${guessHistoryText.guess_text}</text>\n`;
                if (guessHistoryText.winner == true) {
                    svgContent += `\t<text id="Text${index + 1}" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#e53e3e" font-size="90" font-weight="bold" >GAME OVER!</text>\n`
                    svgContent += '</svg>';
                    console.log(svgContent);
                    return new Response(svgContent, { headers: { 'Content-Type': 'image/svg+xml;' } });
                }
                index++;
            } else {
                svgContent += '</svg>';
                console.log(svgContent);
                return new Response(svgContent, { headers: { 'Content-Type': 'image/svg+xml;' } });
            }
        }
    }

    svgContent += '</svg>';
    console.log(svgContent);
    return new Response(svgContent, { headers: { 'Content-Type': 'image/svg+xml;' } });
}


async function POST(req: any): Promise<Response> {
    return getResponse(req);
}

export default async function main(request: string) {
    return await route({GET, POST}, request)
}
