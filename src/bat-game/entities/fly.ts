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
};
export class Fly {

    scene: Phaser.Scene;
    fly: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    x: number;
    y: number;
    createdTime: number;

    constructor(scene: Phaser.Scene, x: number, y: number, options: FlyOptions) {
        // Store scene
        this.scene = scene;

        // Register updates
        scene.events.on('update', this.update, this);

        // Create physics sprite
        this.fly = this.scene.physics.add.sprite(0, 0, 'sprite-bat-right', 0);
        this.fly.body.setAllowGravity(false);
        this.fly.body.setCircle(this.fly.width * 0.06, this.fly.width * 0.04, this.fly.height * 0.08);
        this.fly.x = x;
        this.fly.y = y;
        this.fly.anims.play(IDLE_ANIM, true);
        scaleBasedOnCamera(this.scene, this.fly, 0.05);

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
        this.fly.x += speedXSine;
        this.fly.y += speedYSine;
    }

}