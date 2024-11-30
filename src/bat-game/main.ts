import { LoadingScene, scenes, setStartingScene } from "./loading";
import { Testing } from "./testing";

const env = location.hostname === 'smokingpandagames.com' ? 'prod' : 'dev';

if (env === 'prod') {
    setStartingScene(new Testing());
} else if (env === 'dev') {
    setStartingScene(new Testing());
}

export const startGame = () => {
    const screenRatio = window.innerWidth / window.innerHeight;
    const desiredRatio = 16/9;
    const inverseRatio = 9/16;
    const gameWidth = screenRatio > desiredRatio ? (window.innerHeight * desiredRatio) : window.innerWidth;
    const gameHeight = gameWidth * inverseRatio;
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0px';
    document.body.style.padding = '0px';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    new Phaser.Game({
        width: gameWidth,
        height: gameHeight,
        type: Phaser.AUTO,
        scene: [
            LoadingScene,
            ...scenes,
        ],
        backgroundColor: '#ffffff',
        physics: {
            default: 'arcade',
            arcade: {
                debug: true,
                gravity: {
                    y: 600,
                    x: 0,
                }
            }
        }
    })
};