import { registerCreateFunc, registerLoadFunc } from "../loading";
import { getScreenBasedPixels, getScreenBasedSpeed, iterateGroupChildren, scaleBasedOnCamera, scaleTileBasedOnCamera } from "../utils";

const splashWidth = 1802;
const splashHeight = 855;

const PIXEL_IMAGE = 'sprite-pixel';
const WATER_IMAGE = 'sprite-water';
const SPLASH_SHEET = 'sprite-water-splash';
registerLoadFunc((scene: Phaser.Scene) => {
    scene.load.image(WATER_IMAGE, '/water.png');
    scene.load.image(PIXEL_IMAGE, '/pixel.png');

    // Load spritesheet for splash
    scene.load.spritesheet(SPLASH_SHEET, '/splash_sheet.png', {
        frameWidth: splashWidth,
        frameHeight: splashHeight,
    });
});

const SPLASH_ANIM = 'anim-water-splash';
registerCreateFunc((scene: Phaser.Scene) => {
    // Set up splash animation
    scene.anims.create({
        key: SPLASH_ANIM,
        frameRate: 18,
        repeat: 0,
        frames: [
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 0, end: 0 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 11, end: 11 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 22, end: 22 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 29, end: 34 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 1, end: 10 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 12, end: 21 }),
            ...scene.anims.generateFrameNumbers(SPLASH_SHEET, { start: 23, end: 28 }),
        ],
        
    });
});

export class Water {

    scene: Phaser.Scene;
    layers: Phaser.GameObjects.Group;
    hitbox: Phaser.Physics.Arcade.Sprite;
    x: number;
    y: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Store scene
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Register updates
        scene.events.on('update', this.update, this);
        scene.events.on('shutdown', () => {
            scene.events.off('update', this.update);
        });

        // Create water layers
        const waterStartY = getScreenBasedPixels(this.scene, 0.42, 'height');
        const waterWidth = getScreenBasedPixels(this.scene, 1, 'width');
        const middleLayerY = waterStartY + (getScreenBasedPixels(this.scene, 0.02, 'height'));
        const lastLayerY = waterStartY + (getScreenBasedPixels(this.scene, 0.04, 'height'));
        this.layers = this.scene.add.group([
            this.scene.add.tileSprite(
                0,
                waterStartY,
                waterWidth,
                0,
                WATER_IMAGE,
            ),
            this.scene.add.tileSprite(
                0,
                middleLayerY,
                waterWidth,
                0,
                WATER_IMAGE,
            ),
            this.scene.add.tileSprite(
                0,
                lastLayerY,
                waterWidth,
                0,
                WATER_IMAGE,
            ),
        ]);
        iterateGroupChildren<Phaser.GameObjects.TileSprite>(this.layers, (water, index, arr) => {
            scaleTileBasedOnCamera(this.scene, water, 0.25);
            water.setOrigin(0.5, 0);
            if (index === arr.length - 1) {
                water.setDepth(1);
            } else if (index === 0) {
                water.setDepth(-2);
            } else if (index === 0) {
                water.setDepth(-1);
            }
        });

        // Create hitbox for splashing
        // const hitboxX = -getScreenBasedPixels(this.scene, 0.5, 'width');
        const hitbox = this.scene.physics.add.sprite(0, lastLayerY, PIXEL_IMAGE);
        hitbox.setSize(waterWidth, lastLayerY - middleLayerY);
        hitbox.setImmovable(true);
        hitbox.body.setAllowGravity(false);
        hitbox.setOrigin(0.5, 0);
        this.hitbox = hitbox;

    }

    splashColliders = new Map<Phaser.Physics.Arcade.Sprite, Phaser.Physics.Arcade.Collider>();
    registerSplashCollision(sprite: Phaser.Physics.Arcade.Sprite) {
        this.splashColliders.set(
            sprite,
            this.scene.physics.add.overlap(sprite, this.hitbox, () => {
                this.createSplashAt(sprite);
            }),
        );
    }

    createSplashAt(sprite: Phaser.Physics.Arcade.Sprite) {
        const collider = this.splashColliders.get(sprite);
        if (collider) {
            collider.destroy();
        }
        const x = sprite.x + (0.5 - sprite.originX) * sprite.width;
        const splash = this.scene.physics.add.sprite(x, this.hitbox.y - getScreenBasedPixels(this.scene, 0.08, 'height'), SPLASH_SHEET);
        scaleBasedOnCamera(this.scene, splash, 0.3);
        splash.body.setAllowGravity(false);
        splash.setDepth(-1);
        splash.anims.play(SPLASH_ANIM);
        splash.on('animationcomplete-' + SPLASH_ANIM, () => {
            splash.destroy();
        });
    }

    update(time: number) {
        if (this.layers) {
            const maxSpeed = getScreenBasedSpeed(this.scene, 0.003);
            const speed = maxSpeed * (Math.sin(time * 0.002));
            iterateGroupChildren<Phaser.GameObjects.TileSprite>(this.layers, (water, index) => {
                const mult = index % 2 === 0 ? -1 : 1;
                water.tilePositionX += speed * mult;
            });
        }
    }

}