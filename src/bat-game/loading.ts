import { Phaser } from "./barrel";

// Manage loading stuff like images, spritesheets, etc
export type LoadingFunc = (scene: Phaser.Scene) => void;
const loadingFuncs: LoadingFunc[] = [];
export const registerLoadFunc = (func: LoadingFunc) => {
    loadingFuncs.push(func);
};

// Manage loading stuff like anims
export type CreateFunc = (scene: Phaser.Scene) => void;
const createFuncs: CreateFunc[] = [];
export const registerCreateFunc = (func: CreateFunc) => {
    createFuncs.push(func);
};

// Manage scenes
export const scenes: Phaser.Scene[] = [];
export const registerScene = (scene: Phaser.Scene) => {
    scenes.push(scene);
};
let startingScene: Phaser.Scene | null = null;
export const setStartingScene = (scene: Phaser.Scene) => {
    if (startingScene !== null) throw Error('starting scene is already set');
    startingScene = scene;
    registerScene(startingScene);
};

// Always the first scene loaded
export class LoadingScene extends Phaser.Scene {

    loadingText: Phaser.GameObjects.Text | null = null;
    loadingPercent = 0;

    constructor() {
        super('Loading');
    }

    preload() {
        // Create loading text
        const loadingText = this.add.text(0, 0, 'Loading 0%', { color: '#000000' });
        this.loadingText = loadingText;
        this.cameras.main.centerOn(0, 0);

        // Set up loading progress logic
        this.load.on('progress', (percent: number) => {
            this.loadingPercent = Math.round(percent * 100);
            loadingText.setText(`Loading ${this.loadingPercent}%`)
        });
        this.load.on('complete', () => {
            this.scene.start('Main Menu');
        });

        // Load assets
        this.load.baseURL = '/bat-game'
        loadingFuncs.forEach((func) => {
            func(this);
        });
    }

    create() {
        if (startingScene === null) throw Error('starting scene was not set');

        // Run creation functions
        createFuncs.forEach((func) => {
            func(this);
        });
    }

}