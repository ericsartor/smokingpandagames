import { Phaser } from "./barrel";
import { getScreenBasedPixels } from "./utils";

// Always the first scene loaded
export class MainMenuScene extends Phaser.Scene {

    titleText: Phaser.GameObjects.Text | null = null;
    startText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super('Main Menu');
    }

    preload() {
    }

    create() {
        
        // Create title text
        const titleText = this.add.text(0, 0, 'Babs the Bat', { color: '#000000' });
        this.titleText = titleText;
        this.cameras.main.centerOn(0, 0);

        // Create start game text
        const startText = this.add.text(0, getScreenBasedPixels(this, 0.2, 'height'), 'Start', { color: '#000000' });
        this.startText = startText;
        startText.setInteractive();
        startText.on('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        this.scene.start('Testing');
    }

    update(): void {
    }

}