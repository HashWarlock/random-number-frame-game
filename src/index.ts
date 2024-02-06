import "@phala/sidevm-env";
import { FrameRequest } from '@coinbase/onchainkit'
import { getFrameMetadata } from '@coinbase/onchainkit/dist/lib/core/getFrameMetadata'
import { getFrameMessage } from '@coinbase/onchainkit/dist/lib/core/getFrameMessage'
import { Request, Response, renderOpenGraph, route } from './frameSupport'

const BASE_URL = 'https://frames.phatfn.xyz'

async function GET(req: Request): Promise<Response> {
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
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function getResponse(req: Request): Promise<Response> {
    let username: string | undefined = '';
    let answer: string | undefined = '';
    let buttonLabel: string | undefined = '';
    const secret = req.queries?.key ?? ''
    const apiKey = req.secret?.apiKey ?? 'NEYNAR_API';
    const randomNumber = req.secret?.randomNumber;

    const body: FrameRequest = await req.json();

    const { isValid, message } = await getFrameMessage(body, { neynarApiKey: `${apiKey}`});

    if (isValid) {
      username = message.raw.action.interactor.username ?? `fc_id: ${message.raw.action.interactor.fid}`;
      answer = message.input;
      const answerNum = Number(answer);
      if (!isNaN(answerNum)) {
        buttonLabel = `Input NaN ${username}`
      } else if (!isNaN(<number>randomNumber)) {
          buttonLabel = `Random Number Not Set`
      } else if (answer == randomNumber) {
          buttonLabel = `Correct! ${username}`;
      } else { // @ts-ignore
          if (answer > randomNumber) {
              // TODO for SVG generation
          } else {
              // TODO for SVG Generation
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
        image: 'https://framehub.4everland.store/FrameHub.png',
        post_url: BASE_URL + req.path + `?key=${secret[0]}`,
        input: { text: answer },
    });

    return new Response(renderOpenGraph({
            title: BASE_URL + req.path,
            description: 'FrameHub',
            openGraph: {
                title: BASE_URL + req.path,
                description: 'FrameHub',
                images: [`https://framehub.4everland.store/FrameHub.png`],
            },
            other: {
                ...frameMetadata,
            },
        }),
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
}

async function POST(req: any): Promise<Response> {
    return getResponse(req);
}

export default async function main(request: string) {
    return await route({GET, POST}, request)
}
