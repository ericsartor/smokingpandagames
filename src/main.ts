const games: {
  name: string;
  description: string;
  credits: string[];
  path: string;
}[] = [
  {
    name: 'Babs the Bat',
    description: 'Fly around eating flies for as long as you can, dodging falling sheep, spitting fish, and a rude frog.',
    credits: [
      'Eric Sartor: Programming, Game Design',
      'Bridget Fae: Art, Sound, Game Design',
      'Ryan Ulch: Music, Sound, Game Design',
    ],
    path: '/babs/build.html',
  }
];

document.body.innerHTML = `
  <h1>Smoking Panda Games</h1>
  <p>Games made by Eric Sartor, with the help and support of some other pretty cool people!!</p>
  <div id="game-list"></div>
`;

const gameListEl: HTMLElement = document.getElementById('game-list')!;
games.forEach((game) => {
  const div = document.createElement('div');
  div.style.padding = "12px";
  div.style.margin = "12px 0";
  div.style.border = "1px solid black";
  div.style.borderRadius = "6px";
  div.innerHTML = `
    <h2>${game.name}</h2>
    <main>
      <p>${game.description}</p>
      <p>
        <button class="play">Play</button>
      </p>
      <h3>Credits</h3>
      <p>
        ${game.credits.join('<br>')}
      </p>
    <main>
  `;
  div.querySelector('button.play')!.addEventListener('click', () => {
    location.assign(game.path);
  });
  gameListEl.appendChild(div);
});