import { FrameRequest } from '@coinbase/onchainkit'
import { getFrameMetadata } from '@coinbase/onchainkit/dist/lib/core/getFrameMetadata'
import { getFrameMessage } from '@coinbase/onchainkit/dist/lib/core/getFrameMessage'
import {Request, Response, renderOpenGraph, route} from './frameSupport'

const BASE_URL = 'https://frames.phatfn.xyz'

async function GET(req: Request): Promise<Response> {
    if (req.queries?.guess) {
        return createSVGWithShapesAndNumber(req);
    }
    const secret = req.queries?.key ?? '';
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `FrameHub Template\nClick Here!`,
            },
        ],
        image: `https://framehub.4everland.store/PhatFrame.png`,
        post_url: BASE_URL + req.path + `?key=${secret[0]}`,
        input: {text: 'Guess a Number'}
    });

    return new Response(renderOpenGraph({
        title: BASE_URL + req.path,
        description: 'FrameHub',
        openGraph: {
            title: BASE_URL + req.path,
            description: 'FrameHub',
            images: [`https://framehub.4everland.store/PhatFrame.png`],
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
    let answer: string | undefined = '';
    let buttonLabel: string | undefined = '';
    const secret = req.queries?.key ?? ''
    const apiKey = req.secret?.apiKey ?? 'NEYNAR_API';
    const randomNumber = req.secret?.randomNumber;
    let svgGuessText = '';

    const body: FrameRequest = await req.json();

    const { isValid, message } = await getFrameMessage(body, { neynarApiKey: `${apiKey}`});

    if (isValid) {
      username = message.raw.action.interactor.username ?? `fc_id: ${message.raw.action.interactor.fid}`;
      answer = message.input;
      const answerNum = Number(answer);
      if (isNaN(answerNum)) {
          buttonLabel = `Input NaN ${username}`
          svgGuessText = `${username}: Input NaN`
      } else if (isNaN(Number(randomNumber))){
          buttonLabel = `Random Number Not Set`
          svgGuessText = `${username}: No Random Number Set`
      } else if (answerNum == Number(randomNumber)) {
          buttonLabel = `Correct! ${username}`;
          svgGuessText = `${username}: Winner! Guessed ${answerNum}`
      } else { // @ts-ignore
          if (answerNum > Number(randomNumber)) {
              svgGuessText = `${username}: Guessed ${answerNum}. Too High!`
          } else {
              svgGuessText = `${username}: Guessed ${answerNum}. Too Low!`
          }
          buttonLabel = `Incorrect! ${username}`;
      }
    }
    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                label: `${buttonLabel}`,
            },
        ],
        image: [`${BASE_URL}${req.path}?guess=${svgGuessText}`],
        post_url: BASE_URL + req.path + `?key=${secret[0]}`,
        input: { text: answer },
    });

    return new Response(renderOpenGraph({
            title: BASE_URL + req.path,
            description: 'FrameHub',
            openGraph: {
                title: BASE_URL + req.path,
                description: 'FrameHub',
                images: [`${BASE_URL}${req.path}?guess=${svgGuessText}`],
            },
            other: {
                ...frameMetadata,
            },
        }),
        { headers: { 'Content-Type': 'text/html; charset=UTF-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function createSVGWithShapesAndNumber(req: Request): Promise<Response> {
    const guess = req.queries?.guess ?? 'No Guess Detected';
    const svg =
    `
    <svg width="1600" height="800" viewBox="0 0 1600 800" xmlns="http://www.w3.org/2000/svg">
        <path id="Path" fill="#008000" stroke="none" d="M 0 0 L 1600 0 L 1600 800 L 0 800 Z"/>
        <path id="path1" fill="#ffffff" stroke="none" d="M 675 150 C 675 191.421387 641.421387 225 600 225 C 558.578613 225 525 191.421387 525 150 C 525 108.578613 558.578613 75 600 75 C 641.421387 75 675 108.578613 675 150 Z"/>
        <path id="path2" fill="#ffffff" stroke="none" d="M 725 75 L 875 75 L 875 225 L 725 225 Z"/>
        <path id="path3" fill="#ffffff" stroke="none" d="M 1000 75 L 925 225 L 1075 225 Z"/>
        <text id="text1" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="45" font-weight="bold" >${guess}</text>
        <path id="path4" fill="#ffffff" stroke="none" d="M 400 550 L 1200 550 L 1200 600 L 400 600 Z"/>
        <path id="path5" fill="#ffffff" stroke="none" d="M 400 650 L 1200 650 L 1200 700 L 400 700 Z"/>
    </svg>
  `;

    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

async function POST(req: any): Promise<Response> {
    return getResponse(req);
}

export default async function main(request: string) {
    return await route({GET, POST}, request)
}
