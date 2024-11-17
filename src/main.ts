// import { startGame } from "./practice";
// import { startGame } from "./test";
// import { startGame } from "./practice2";
import { startGame } from "./bat-game/main";

const startGameButton = document.createElement('button');
startGameButton.textContent = 'Start Game';
startGameButton.addEventListener('click', () => {
  startGameButton.parentElement?.removeChild(startGameButton);
  startGame();
});
document.body.appendChild(startGameButton);
