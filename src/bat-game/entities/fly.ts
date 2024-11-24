import { Phaser } from "../barrel";
import { registerCreateFunc, registerLoadFunc } from "../loading";
import { getScreenBasedSpeed, scaleBasedOnCamera } from "../utils";

const flyFrameWidth = 160;
const flyFrameHeight = 166;

const IDLE_SHEET = 'sprite-fly-left';
registerLoadFunc((scene: Phaser.Scene) => {
    // Load spritesheet for idling
    scene.load.spritesheet(IDLE_SHEET, '/fly/fly_idle_sheet.png', {
        frameWidth: flyFrameWidth,
        frameHeight: flyFrameHeight,
    });
});

const IDLE_ANIM = 'anim-fly-left';
registerCreateFunc((scene: Phaser.Scene) => {
    // Set up idle animation
    scene.anims.create({
        key: IDLE_ANIM,
        frameRate: 18,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 1, end: 1 }),
        ],
    });
});

type FlyOptions = {
    createdTime: number;
    hitBoxStyle: 'overlap' | 'normal';
};
export class Fly {

    scene: Phaser.Scene;
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    x: number;
    y: number;
    createdTime: number;

    constructor(scene: Phaser.Scene, x: number, y: number, options: FlyOptions) {
        // Store scene
        this.scene = scene;

        // Register updates
        scene.events.on('update', this.update, this);

        // Create physics sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, 'sprite-bat-right', 0);
        this.sprite.body.setAllowGravity(false);
        if (options.hitBoxStyle === 'normal') {
            this.sprite.body.setCircle(this.sprite.width * 0.06, this.sprite.width * 0.04, this.sprite.height * 0.08);
        } else {
            this.sprite.body.setCircle(this.sprite.width * 0.008, this.sprite.width * 0.1, this.sprite.height * 0.15);
        }
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.anims.play(IDLE_ANIM, true);
        scaleBasedOnCamera(this.scene, this.sprite, 0.05);

        // Store base position
        this.x = x;
        this.y = y;
        this.createdTime = options.createdTime;
    }

    update(time: number) {
        const timeElapsed = time - this.createdTime;
        const speed = getScreenBasedSpeed(this.scene, 0.0002);
        const speedXSine = speed * (Math.sin(timeElapsed * 0.005));
        const speedYSine = speed * (Math.sin(timeElapsed * 0.01));
        this.sprite.x += speedXSine;
        this.sprite.y += speedYSine;
    }

}