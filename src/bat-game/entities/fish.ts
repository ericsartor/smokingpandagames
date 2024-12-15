import { CHARACTER_SCALE } from "../data";
import { registerCreateFunc, registerLoadFunc } from "../loading";
import { getScreenBasedPixels, getScreenBasedSpeed, scaleBasedOnCamera } from "../utils";

type ColorConfig = {
    spritesheetKey: string;
    spritesheetUrl: string;
    animName: string;
    frameWidth: number;
    frameHeight: number;
};
const fishColorConfigs: { [color: string]: ColorConfig } = {
    yellow: {
        spritesheetKey: 'sprite-fish-yellow-right',
        spritesheetUrl: '/fish/yellow_sprite_sheet.png',
        animName: 'anim-fish-yellow-right',
        frameWidth: 579,
        frameHeight: 508,
    },
};
const spitSpritesheetKey = 'sprite-fish-spit-right';
const spitSpritesheetUrl = '/fish/fishspit.png';
const spitFrameWidth = 325;
const spitFrameHeight = 404;
const spitAnimName = 'anim-fish-spit-right';
const spitIdleAnimName = 'anim-fish-spit-right-idle';

// Register fish load functions
registerLoadFunc((scene) => {
    // Different colored fish spritesheets
    Object.keys(fishColorConfigs).forEach((color) => {
        const config = fishColorConfigs[color];

        // Sprite sheet
        scene.load.spritesheet(config.spritesheetKey, config.spritesheetUrl, {
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
        });
    });

    // Fish spit spritesheet
    scene.load.spritesheet(spitSpritesheetKey, spitSpritesheetUrl, {
        frameWidth: spitFrameWidth,
        frameHeight: spitFrameHeight,
    });
});

registerCreateFunc((scene) => {
    // Different colored fish spritesheets
    Object.keys(fishColorConfigs).forEach((color) => {
        const config = fishColorConfigs[color];

        // Animation
        scene.anims.create({
            key: config.animName,
            frameRate: 15,
            repeat: -1,
            frames: scene.anims.generateFrameNumbers(config.spritesheetKey, { start: 0, end: 3 }),
        });
    });

    // Fish spit animations
    scene.anims.create({
        key: spitAnimName,
        frameRate: 15,
        repeat: 0,
        frames: scene.anims.generateFrameNumbers(spitSpritesheetKey, { start: 0, end: 4 }),
    });
    scene.anims.create({
        key: spitIdleAnimName,
        frameRate: 15,
        repeat: -1,
        frames: scene.anims.generateFrameNumbers(spitSpritesheetKey, { start: 2, end: 4 }),
    });
});

type FishOptions = {
    color: string;
    direction: 'left' | 'right';
    startTime: number;
    upTime: number;
    stayTime: number;
    downTime: number;
    spitHandler: (spit: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => void;
    depth: number;
};
export class Fish {

    scene: Phaser.Scene;
    sprite: Phaser.GameObjects.Sprite;
    spit: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    upPixels: number;
    upTime: number;
    stayTime: number;
    downTime: number;
    startTime: number;
    fishDestroyed = false;
    spitDestroyed = false;
    done =  false;
    initialY: number;
    direction: 'left' | 'right';
    depth: number;
    spitCreated = false;
    spitHandler: (spit: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => void;

    constructor(scene: Phaser.Scene, x: number, y: number, options: FishOptions) {
        if (!fishColorConfigs[options.color]) throw Error('invalid fish color: ' + options.color);
        const fishConfig = fishColorConfigs[options.color];

        // Store scene
        this.scene = scene;

        // Store spit handler
        this.spitHandler = options.spitHandler;

        // Set timing/position data
        this.upPixels = getScreenBasedPixels(scene, 0.1, 'height');
        this.upTime = options.upTime;
        this.stayTime = options.stayTime;
        this.downTime = options.downTime;
        this.startTime = options.startTime;
        this.initialY = y;
        this.direction = options.direction;

        // Register updates
        scene.events.on('update', this.update, this);
        scene.events.on('shutdown', () => {
            scene.events.off('update', this.update);
        });

        // Create fish sprite
        this.sprite = scene.add.sprite(x, y, fishConfig.spritesheetKey);
        this.sprite.setDepth(options.depth);
        this.depth = options.depth;

        // Set origin based on direction
        this.sprite.setOrigin(
            options.direction === 'right' ? 0 : 1,
            0,
        );

        // Flip sprite based on direction
        if (options.direction === 'left') {
            this.sprite.setFlipX(true);
        }

        // Angle fish up based on direction
        this.sprite.setRotation(options.direction === 'right' ? -0.453786 : 0.453786);

        // Set scale on fish
        scaleBasedOnCamera(scene, this.sprite, CHARACTER_SCALE);

        // Start animation
        this.sprite.anims.play(fishConfig.animName);

        // Create spit
        this.spit = scene.physics.add.sprite(
            x + getScreenBasedPixels(scene, 0.11 * (options.direction === 'left' ? -1 : 1), 'width'),
            y - getScreenBasedPixels(scene, 0.11, 'height'),
            spitSpritesheetKey,
            0,
        );
        if (options.direction === 'left') {
            this.spit.setFlipX(true);
        }
        this.spit.setVisible(false);
        this.spit.body.setAllowGravity(false);
        scaleBasedOnCamera(scene, this.spit, 0.04);
        this.spitHandler(this.spit);
    }

    update(time: number) {

        if (this.done) {
            this.scene.events.on('shutdown', () => {
                this.scene.events.off('update', this.update);
            });
            return;
        }

        const totalTime = this.upTime + this.stayTime + this.downTime;
        
        // Get time since fish was spawned
        const timeSinceStart = (time - this.startTime) / 1000;

        // Check if we need to destroy the fish
        if (timeSinceStart > totalTime) {
            this.sprite.destroy();
            this.fishDestroyed = true;
            if (this.spitDestroyed) {
                this.done = true;
            }
        }

        // Handle moving the spit and spawning the spit
        if (timeSinceStart <= this.upTime) {
            this.sprite.y = this.initialY - (timeSinceStart / this.upTime * this.upPixels);
        } else if (timeSinceStart >= this.upTime && !this.spitCreated) {
            this.spitCreated = true;
            this.spit.setVisible(true);
            this.spit.anims.play(spitAnimName, true);
            this.spit.anims.chain(spitIdleAnimName);
            const mult = this.direction === 'right' ? 1 : -1;
            const xSpeed = mult * getScreenBasedSpeed(this.scene, 0.35) * Phaser.Math.FloatBetween(0.75, 1.25);
            const ySpeed = -Math.abs(xSpeed) * Phaser.Math.FloatBetween(1.4, 2.2);
            this.spit.setVelocity(xSpeed, ySpeed);
            this.spit.body.setAllowGravity(true);
        } else if (timeSinceStart >= this.upTime + this.stayTime) {
            const timeLeft = this.upTime + this.stayTime + this.downTime - timeSinceStart;
            this.sprite.y = this.initialY - (timeLeft / this.downTime * this.upPixels);
        }

        // Check if we need to destroy the spit
        if (this.spit.y > getScreenBasedPixels(this.scene, 1, 'height')) {
            this.spitDestroyed = true;
            this.spit.destroy();
            if (this.fishDestroyed) {
                this.done = true;
            }
        }

    }

}
