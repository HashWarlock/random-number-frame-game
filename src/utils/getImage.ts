import {Request, Response} from "../frameSupport";
import {getGameStatus, getGuessHistory} from "../db/supabase";

export enum Scenario {
  GuessHistory,
  Tip,
  GameOver,
  Rules,
  Invalid,
}

export function getScenarioNumber(scenario: Scenario): number {
  switch (scenario) {
    case Scenario.GuessHistory:
      return 0;
    case Scenario.Tip:
      return 1;
    case Scenario.GameOver:
      return 2;
    case Scenario.Rules:
      return 3;
    case Scenario.Invalid:
      return 4;
    default:
      return 0;
  }
}

export function getScenario(scenarioNumber: number): Scenario {
  switch (scenarioNumber) {
    case 0:
      return Scenario.GuessHistory;
    case 1:
      return Scenario.Tip;
    case 2:
      return Scenario.GameOver;
    case 3:
      return Scenario.Rules;
    case 4:
      return Scenario.Invalid;
    default:
      return Scenario.GuessHistory;
  }
}

export async function homeFrameSVG(req: Request): Promise<Response> {
  const fontColor = '#000000';
  const bgColor = '#cdfa50';

  const svg =
    `<svg width="1200" height="632" viewBox="0 0 1200 632" xmlns="http://www.w3.org/2000/svg">
    <path id="bg" fill="${bgColor}" stroke="none" d="M 25 0 L 1175 0 C 1188.807129 0 1200 11.192871 1200 25 L 1200 606.578979 C 1200 620.386108 1188.807129 631.578979 1175 631.578979 L 25 631.578979 C 11.192882 631.578979 0 620.386108 0 606.578979 L 0 25 C -0 11.192871 11.192882 0 25 0 Z"/>
    <g id="text">
        <text id="title" x="80" y="230" font-family="Helvetica" font-size="96" font-weight="900" fill="${fontColor}">
            Guess a Number
        </text>
        <text id="subtitle" font-size="32" font-weight="400" fill="${fontColor}" font-family="Helvetica">
            <tspan x="80" y="310">🥇 Be the first to win <tspan font-weight="900">0.01 USDC</tspan></tspan>
            <tspan x="80" y="370">🤔 Guess a number from <tspan font-weight="900">1</tspan> to <tspan font-weight="900">1000</tspan></tspan>
            <tspan x="80" y="430">🆓 First guess is <tspan font-weight="900">FREE</tspan></tspan>
          <tspan x="80" y="490">🤝 <tspan font-weight="900">Follow</tspan>, <tspan font-weight="900">Like</tspan>, and <tspan font-weight="900">Recast</tspan> for extra guess</tspan>
        </text>
    </g>
    <g id="powered-by">
        <text id="phala" x="60" y="580" font-size="32" font-family="helvetica">
            Hosted on <tspan font-weight="900">@FrameHub</tspan> 💎 by <tspan font-weight="900">Phala Network</tspan>
        </text>
    </g>
    </svg>
    `
  console.log(svg);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

function getInvalidPlayerRequirements(requirement: any, type: string): string {
  let message = type;
  if (requirement) {
    if (requirement[0] === 'true') {
      message = '✅  ' + message;
    } else {
      message = '❌ ' + message;
    }
  }
  return message;
}

function getTipTag(req: Request) {
  const following = req.queries?.following;
  const liked = req.queries?.liked;
  const recasted = req.queries?.recasted;
  const outlineColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  const whiteFontColor = '#ffffff';
  const tipBoxBgColor = '#000000';

  return `<g id="tip">
      <path id="Path-copy" fill="${tipBoxBgColor}" stroke="${outlineColor}" stroke-width="5" d="M 50 200 L 1150 200 L 1150 600 L 50 600 Z"/>
      <path id="path2" fill="${tipBoxBgColor}" stroke="${outlineColor}" stroke-width="5" d="M 70 280 L 1130 280 L 1130 580 L 70 580 Z"/>
      <text id="Tip" x="520" y="250" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">📝Tip</text>    
      <text id="Must-Follow-Like-"><tspan x="100" y="350" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">Must <tspan fill="${whiteFontColor}" text-decoration="underline">Follow</tspan>, <tspan fill="${whiteFontColor}" text-decoration="underline">Like</tspan>, &amp; <tspan fill="${whiteFontColor}" text-decoration="underline">Recast</tspan> to execute action.</tspan></text>
      <text id="Follow" x="100" y="420" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">${getInvalidPlayerRequirements(following, 'Follow')}</text>
      <text id="Like" x="100" y="480" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">${getInvalidPlayerRequirements(liked, 'Like')}</text>
      <text id="Recast" x="100" y="540" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}" >${getInvalidPlayerRequirements(recasted, 'Recast')}</text>
    </g>`;
}

function getInvalidGuessTag(message: string): string {
  const outlineColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  return `<g id="sorry">
      <path id="Path-copy" fill="#000000" stroke="${outlineColor}" stroke-width="5" d="M 50 200 L 1150 200 L 1150 600 L 50 600 Z"/>
      <path id="path2" fill="#000000" stroke="${outlineColor}" stroke-width="5" d="M 70 280 L 1130 280 L 1130 580 L 70 580 Z"/>
      <text id="WARNING" x="520" y="250" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}" >📝Tip</text>   
      <text id="Invalid-Guess-"><tspan x="100" y="350" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">☠️ ${message}</tspan></text>
    </g>`;
}

function getRulesTag(): string {
  const bgColor = '#000000';
  const outlineColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  const whiteFontColor = '#ffffff';

  return `<g id="rules">
        <path id="Path-copy" fill="${bgColor}" stroke="${outlineColor}" stroke-width="5" d="M 50 200 L 1150 200 L 1150 600 L 50 600 Z"/>
        <path id="path2" fill="${bgColor}" stroke="${outlineColor}" stroke-width="5" d="M 70 280 L 1130 280 L 1130 580 L 70 580 Z"/>
        <text id="Rules"  x="510" y="253" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}">📜Rules</text>
        <text id="rule-set" font-size="32" font-weight="400" fill="${historyFontColor}" font-family="Helvetica">
            <tspan x="90" y="340">🤔 Guess a number from <tspan fill="${whiteFontColor}" font-weight="900">1</tspan> to <tspan fill="${whiteFontColor}" font-weight="900">1000</tspan></tspan>
            <tspan x="90" y="410">🆓 First guess is <tspan fill="${whiteFontColor}" font-weight="900">FREE</tspan></tspan>
            <tspan x="90" y="480">🤝 <tspan fill="${whiteFontColor}" font-weight="900">Follow</tspan>, <tspan fill="${whiteFontColor}" font-weight="900">Like</tspan>, and <tspan fill="${whiteFontColor}" font-weight="900">Recast</tspan> for extra guess</tspan>
            <tspan x="90" y="550">🥇 Winner gets <tspan fill="${whiteFontColor}" font-weight="900">0.01 USDC</tspan>, covered by <tspan fill="${whiteFontColor}" font-weight="900">FrameHub</tspan> / <tspan fill="${whiteFontColor}" font-weight="900">Phala Network</tspan></tspan>
        </text>
    </g>`
}

function getGameOverTag(playerCount: string, username: string): string {
  const outlineColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  const whiteFontColor = '#ffffff';
  return `<g id="gameover">
      <path id="Path-copy" fill="#000000" stroke="${outlineColor}" stroke-width="5" d="M 50 200 L 1150 200 L 1150 600 L 50 600 Z"/>
      <path id="path2" fill="#000000" stroke="${outlineColor}" stroke-width="5" d="M 70 280 L 1130 280 L 1130 580 L 70 580 Z"/>
      <text id="Tip" x="520" y="250" font-family="Courier" font-size="36" font-weight="700" fill="${historyFontColor}" >📝Tip</text>   
      <text id="Game-over"><tspan x="100" y="350" font-family="Courier" font-size="36" font-weight="900" fill="${whiteFontColor}">🎇 Game Over!</tspan></text>
      <text id="Winner"><tspan x="100" y="410" font-family="Courier" font-size="32" font-weight="700" fill="${historyFontColor}"><tspan fill="${whiteFontColor}" font-weight="900">${playerCount} </tspan>players joined the game. <tspan fill="pink" font-weight="900">@${username}</tspan> won.</tspan></text>
    </g>`;
}

export async function getGuessHistorySVG(req: Request): Promise<Response> {
  const supabaseApiKey = req.secret?.supabaseApiKey ?? '';
  const gameId = req.queries?.gameId ?? '';
  const rules = req.queries?.rules;
  const invalidGuess = req.queries?.invalidGuess;
  const gameStatus = await getGameStatus(supabaseApiKey, gameId[0]);
  const lastGuesses = await getGuessHistory(supabaseApiKey, gameId[0]);
  const scenario = req.queries?.scenario ?? ['0'];
  let winnerUsername = '';

  const titleColor = '#000000';
  const bgColor = '#cdfa50';
  const historyFontColor = '#cdfa50';
  const historyXCoordinate = 20;
  const historyYCoordinate = 170;
  const yCoordinateIncrement = 50;

  const closingHistoryTag = `\t\t</text>\n\t</g>`;
  const closingSvgTag = `</svg>`;
  let svg = `
  <svg width="1200" height="632" viewBox="0 0 1200 632" xmlns="http://www.w3.org/2000/svg" >
    <path id="Path" fill="${bgColor}" stroke="none" d="M 15 0 L 1185 0 C 1193.284302 0 1200 6.715698 1200 15 L 1200 616.578979 C 1200 624.863281 1193.284302 631.578979 1185 631.578979 L 15 631.578979 C 6.715729 631.578979 0 624.863281 0 616.578979 L 0 15 C -0 6.715698 6.715729 0 15 0 Z"/>
    <text id="title" font-family="Helvetica" font-size="54" font-weight="700" fill="${titleColor}" x="30" y="80">🤔 Guess a Number (1 - 1000)</text>
    <g id="history">
        <rect width="1200" height="512" y="120" fill="rgba(0,0,0,0.8)" />
        <text font-family="monospace" font-size="36" font-weight="700" fill="${historyFontColor}">\n`;
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
      winnerUsername = username;
    }
    latestYCoordinateMultiplier++;
  }
  svg += closingHistoryTag;
  switch (getScenario(Number(scenario[0]))) {
    case Scenario.Tip:
      svg += getTipTag(req);
      break;
    case Scenario.GameOver:
      getGameOverTag(gameStatus[0].player_count, winnerUsername);
      break;
    case Scenario.Rules:
      svg += getRulesTag();
      break;
    case Scenario.Invalid:
      svg += getInvalidGuessTag(invalidGuess[0]);
      break;
    default:
      (!gameStatus[0].active) ? svg += getGameOverTag(gameStatus[0].player_count, winnerUsername) : svg;
  }

  svg += closingSvgTag;
  console.log(svg);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}

export async function getCreateYourNewGame(req: Request): Promise<Response> {
  const titleColor = '#000000';
  const bgColor = '#cdfa50';
  const createGameFontColor = '#cdfa50';
  const whiteFontColor = '#ffffff';
  let svg = `
  <svg width="1200" height="632" viewBox="0 0 1200 632" xmlns="http://www.w3.org/2000/svg" >
    <path id="Path" fill="${bgColor}" stroke="none" d="M 15 0 L 1185 0 C 1193.284302 0 1200 6.715698 1200 15 L 1200 616.578979 C 1200 624.863281 1193.284302 631.578979 1185 631.578979 L 15 631.578979 C 6.715729 631.578979 0 624.863281 0 616.578979 L 0 15 C -0 6.715698 6.715729 0 15 0 Z"/>
    <text id="title" font-family="Helvetica" font-size="54" font-weight="700" fill="${titleColor}" x="30" y="80">🎮 Creating Your New Game</text>
    <g id="history">
        <rect width="1200" height="512" y="120" fill="rgba(0,0,0,0.8)" />
        <text font-family="monospace" font-size="36" font-weight="700" fill="${createGameFontColor}">
          <tspan x="20" y="170">You are creating your new <tspan fill="${whiteFontColor}">Guess a Number Game</tspan></tspan>
          <tspan x="20" y="250" fill="${whiteFontColor}">📜 Your Game Rules</tspan></text>
          <text id="rule-set" font-size="32" fill="${createGameFontColor}" font-family="monospace" font-weight="700">
            <tspan x="70" y="320">🤔 Guess a number from <tspan fill="${whiteFontColor}" font-weight="900">1</tspan> to <tspan fill="${whiteFontColor}" font-weight="900">1000</tspan></tspan>
            <tspan x="70" y="400">🆓 First guess is <tspan fill="${whiteFontColor}" font-weight="900">FREE</tspan></tspan>
            <tspan x="70" y="480">🤝 Players should <tspan fill="${whiteFontColor}" font-weight="900">Follow</tspan> you, <tspan fill="${whiteFontColor}" font-weight="900">Like</tspan>, and <tspan fill="${whiteFontColor}" font-weight="900">Recast</tspan> to earn extra guess</tspan>
            <tspan x="70" y="560">🥇 Winner gets <tspan fill="${whiteFontColor}" font-weight="900">0.01 USDC</tspan>, covered by <tspan fill="${whiteFontColor}" font-weight="900">FrameHub</tspan> / <tspan fill="${whiteFontColor}" font-weight="900">Phala Network</tspan></tspan>
        </text>
    </g>
  </svg>
  `;
  console.log(svg);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml;' } });
}
