import {Request, Response} from "../frameSupport";
import {getGuessHistory, getGameStatus} from "../db/supabase";

export async function homeFrameSVG(req: Request): Promise<Response> {
  const fontColor = '#000000';
  const bgColor = '#cdfa50';

  const svg =
    `<svg width="1200" height="632" viewBox="0 0 1200 632" xmlns="http://www.w3.org/2000/svg">
    <path id="bg" fill="${bgColor}" stroke="none" d="M 25 0 L 1175 0 C 1188.807129 0 1200 11.192871 1200 25 L 1200 606.578979 C 1200 620.386108 1188.807129 631.578979 1175 631.578979 L 25 631.578979 C 11.192882 631.578979 0 620.386108 0 606.578979 L 0 25 C -0 11.192871 11.192882 0 25 0 Z"/>
    <g id="text">
        <text id="title" x="80" y="250" font-family="Helvetica" font-size="96" font-weight="900" fill="${fontColor}">
            Guess a Number
        </text>
        <text id="subtitle" font-size="50" font-weight="400" fill="${fontColor}" font-family="Helvetica">
            <tspan x="80" y="380">Be the first to win</tspan> <tspan>0.01</tspan> <tspan>USDC</tspan>
        </text>
    </g>
    <g id="powered-by">
        <text id="phala" x="60" y="580" font-size="36" font-family="helvetica">
            Hosted on @FrameHub 💎 by Phala Network
        </text>
    </g>
    </svg>
    `
  console.log(svg);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

export async function getGuessHistorySVG(req: Request): Promise<Response> {
  const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
  const gameId = req.queries?.gameId ?? '';
  const validPlayer = req.queries?.validPlayer ?? false;
  const gameStatus = await getGameStatus(supabaseApiKey, gameId[0]);
  const lastGuesses = await getGuessHistory(supabaseApiKey, gameId[0]);

  const titleColor = '#000000';
  const bgColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  const historyXCoordinate = 20;
  const historyYCoordinate = 170;
  const yCoordinateIncrement = 50;

  const warningGroupTag = `<g id="warning">
        <rect width="1000" height="100" x="100" y="450" style="stroke:#cdfa50;stroke-width:5;stroke-opacity:1" />
        <text fill="${historyFontColor}" font-family="monospace" font-size="36" y="510" x="50%" text-anchor="middle">Follow, Like, and Recast to Guess</text>
    </g>`;
  const closingHistoryTag = `\t\t</text>\n\t</g>`;
  const closingSvgTag = `</svg>`;
  let svg = `
  <svg width="1200" height="632" viewBox="0 0 1200 632" xmlns="http://www.w3.org/2000/svg" >
    <path id="Path" fill="${bgColor}" stroke="none" d="M 15 0 L 1185 0 C 1193.284302 0 1200 6.715698 1200 15 L 1200 616.578979 C 1200 624.863281 1193.284302 631.578979 1185 631.578979 L 15 631.578979 C 6.715729 631.578979 0 624.863281 0 616.578979 L 0 15 C -0 6.715698 6.715729 0 15 0 Z"/>
    <text id="title" font-family="Helvetica" font-size="54" font-weight="700" fill="${titleColor}" x="60" y="80">Guess a number</text>
    <g id="history">
        <rect width="1200" height="512" y="120" fill="rgba(0,0,0,0.8)" />
        <text font-family="monospace" font-size="36" font-weight="700" fill="${historyFontColor}">\n`;

  let outputLines = 9;
  // @ts-ignore
  const startingLine = `${gameStatus[0].created_at.slice(0,5)} Game Started`;
  svg += `\t\t<tspan x="${historyXCoordinate}" y="${historyYCoordinate}">${startingLine}</tspan>\n`;
  let latestYCoordinateMultiplier = 1;
  for (let i = lastGuesses.length - 1; i >= 0; i--) {
    const guess = lastGuesses[i];
    const username = guess.username;
    const guessText = guess.guess;
    const guessTime = guess.created_at.slice(0,5);
    const isWinner = guess.is_winner;
    svg += `\t\t<tspan x="${historyXCoordinate}" y="${(latestYCoordinateMultiplier * yCoordinateIncrement) + historyYCoordinate}">${guessTime}</tspan> <tspan fill="pink"> @${username}</tspan><tspan> ${guessText}</tspan>\n`
    if (isWinner) {
      svg += `${closingHistoryTag}\n<g id="warning">
        <rect width="1000" height="100" x="100" y="450" style="stroke:#cdfa50;stroke-width:5;stroke-opacity:1" />
        <text fill="${historyFontColor}" font-family="monospace" font-size="36" y="510" x="50%" text-anchor="middle">${gameStatus[0].player_count} joined the game and <tspan fill="pink">${username}</tspan> won.</text>
        </g>
      </svg>`;
      console.log(svg);
      return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
    }
    latestYCoordinateMultiplier++;
  }
  svg += closingHistoryTag;
  if (!validPlayer) {
    svg += warningGroupTag;
  }
  svg += closingSvgTag;
  console.log(svg);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}
