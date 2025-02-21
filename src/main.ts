const games: {
  name: string;
  credits: string;
  path: string;
}[] = [
  {
    name: 'Babs the Bat',
    credits: 'Programming / Game Design by Eric Sartor, Art / Sound / Game Design by Bridget Fae, Music / Sound / Game Design by Ryan Ulch',
    path: '/babs/build.html',
  }
];

document.body.innerHTML = '<div>We are a lil hobby game studio!</div>';

games.forEach((game) => {
  const div = document.createElement('div');
  div.innerHTML = `
    <button style="margin-right: 12px;">Play</button>${game.name} - ${game.credits}
  `;
  div.children[0].addEventListener('click', () => {
    location.assign(game.path);
  });
  document.body.appendChild(div);
});