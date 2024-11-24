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

    constructor() {
        super('Loading');
    }

    preload() {
        this.load.baseURL = '/bat-game'
        loadingFuncs.forEach((func) => {
            func(this);
        });
    }

    create() {
        if (startingScene === null) throw Error('starting scene was not set');

        createFuncs.forEach((func) => {
            func(this);
        });

        this.scene.start('Testing');
    }

}