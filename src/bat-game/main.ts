import { Testing } from "./testing";


const startingScene = Testing;

export const startGame = () => {
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0px';
    document.body.style.padding = '0px';
    document.body.style.display = 'flex';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    new Phaser.Game({
        width: window.innerWidth,
        height: window.innerWidth * (9/16),
        type: Phaser.AUTO,
        scene: startingScene,
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