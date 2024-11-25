// import { startGame } from "./practice";
// import { startGame } from "./test";
// import { startGame } from "./practice2";
import { startGame } from "./bat-game/main";

const games: {
  name: string;
  credits: string;
  start: Function;
}[] = [
  {
    name: 'Bat Game',
    credits: 'Programming / Game Design by Eric Sartor, Art / Game Design by Bridget Fae',
    start: startGame,
  }
];

document.body.innerHTML = '<div>We are a lil hobby game studio!</div>';

games.forEach((game) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <button style="margin-right: 12px;">Play</button>${game.name} - ${game.credits}
  `;
  div.children[0].addEventListener('click', () => {
    document.body.innerHTML = '';
    game.start();
  });
  document.body.appendChild(div);
});