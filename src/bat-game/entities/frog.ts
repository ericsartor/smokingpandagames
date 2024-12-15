import { registerCreateFunc, registerLoadFunc } from "../loading";
import { getScreenBasedPixels, getScreenBasedSpeed, scaleBasedOnCamera } from "../utils";

const frogFrameWidth = 759;
const frogFrameHeight = 719;

const IDLE_SHEET = 'frog-idle-sheet';
const CROAK_SHEET = 'frog-croak-sheet';
const BARF_SHEET = 'frog-barf-sheet';
const LILY_PAD_SHEET = 'frog-lily-pad-sheet';
const TONGUE_SHEET = 'frog-tongue-sheet';
registerLoadFunc((scene: Phaser.Scene) => {
    // Load spritesheet for idle
    scene.load.spritesheet(IDLE_SHEET, '/frog/frog_idle_sheet.png', {
        frameWidth: frogFrameWidth,
        frameHeight: frogFrameHeight,
    });
    
    // Load spritesheet for croak
    scene.load.spritesheet(CROAK_SHEET, '/frog/frog_croak_sheet.png', {
        frameWidth: frogFrameWidth,
        frameHeight: frogFrameHeight,
    });

    // Load spritesheet for barf
    scene.load.spritesheet(BARF_SHEET, '/frog/frog_barf_sheet.png', {
        frameWidth: frogFrameWidth,
        frameHeight: frogFrameHeight,
    });

    // Load spritesheet for lily pad
    scene.load.spritesheet(LILY_PAD_SHEET, '/frog/lily_pad_sheet.png', {
        frameWidth: 708,
        frameHeight: 192,
    });

    // Load spritesheet for tongue
    scene.load.spritesheet(TONGUE_SHEET, '/frog/frog_tongue_sheet.png', {
        frameWidth: 759,
        frameHeight: 2142,
    });
});

const IDLE_FRAME_RATE = 9;
const IDLE_ANIM = 'anim-frog-idle';
const CROAK_ANIM = 'anim-frog-croak';
const BARF_ANIM = 'anim-frog-barf';
const LILY_PAD_ANIM = 'anim-frog-lily-pad';
const TONGUE_ANIM = 'anim-frog-tongue';
registerCreateFunc((scene: Phaser.Scene) => {
    // Set up idle animation
    scene.anims.create({
        key: IDLE_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up croak animation
    scene.anims.create({
        key: CROAK_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: 0,
        frames: [
            ...scene.anims.generateFrameNumbers(CROAK_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(CROAK_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up barf animation
    scene.anims.create({
        key: BARF_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: 0,
        frames: [
            ...scene.anims.generateFrameNumbers(BARF_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(BARF_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up lily pad animation
    scene.anims.create({
        key: LILY_PAD_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(LILY_PAD_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(LILY_PAD_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up tongue animation
    scene.anims.create({
        key: TONGUE_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: 0,
        frames: [
            ...scene.anims.generateFrameNumbers(TONGUE_SHEET, { start: 0, end: 8 }),
            ...scene.anims.generateFrameNumbers(TONGUE_SHEET, { start: 7, end: 1 }),
        ],
    });
});

type FrogOptions = {
    scale: number;
};
export class Frog {

    scene: Phaser.Scene;
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    lilyPad: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    scale: number;
    lastCroak = 0;
    lilyPadOffset: number;
    lastTongue = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, options: FrogOptions) {
        // Store scene
        this.scene = scene;

        // Register updates
        scene.events.on('update', this.update, this);
        scene.events.on('shutdown', () => {
            scene.events.off('update', this.update);
        });

        // Create lily pad sprite
        this.lilyPadOffset = getScreenBasedPixels(this.scene, 0, 'width');
        this.lilyPad = this.scene.physics.add.sprite(0, 0, LILY_PAD_SHEET, 0);
        this.lilyPad.anims.play(LILY_PAD_ANIM);
        this.lilyPad.body.setAllowGravity(false);
        this.lilyPad.x = x + this.lilyPadOffset;
        this.lilyPad.y = y + getScreenBasedPixels(this.scene, 0.035, 'height');
        this.scale = options.scale * 1;
        scaleBasedOnCamera(this.scene, this.lilyPad, this.scale);

        // Create frog sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, IDLE_SHEET, 0);
        this.sprite.anims.play(IDLE_ANIM);
        this.sprite.body.setAllowGravity(false);
        this.sprite.body.setCircle(this.sprite.width * 0.25, this.sprite.width * 0.25, this.sprite.height * 0.06);
        this.sprite.x = x;
        this.sprite.y = y;
        this.scale = options.scale;
        scaleBasedOnCamera(this.scene, this.sprite, this.scale);

    }

    moveFrogX(x: number) {
        this.sprite.x = x;
        this.lilyPad.x = this.sprite.x + this.lilyPadOffset;
    }

    update(time: number) {
        const speed = getScreenBasedSpeed(this.scene, 0.0003);
        const speedYSine = speed * (Math.sin(time * 0.005));
        this.sprite.y += speedYSine;
        this.lilyPad.y += speedYSine;

        const currentAnim = this.sprite.anims.currentAnim;
        if (currentAnim) {
            if (currentAnim.key === IDLE_ANIM) {
                if (time - this.lastTongue > 5000) {
                    this.lastTongue = time;
                    this.sprite.anims.play(TONGUE_ANIM);
                    this.sprite.setOrigin(0.5, 0.84);
                } else if (time - this.lastCroak > 5000) {
                    this.lastCroak = time;
                    this.sprite.anims.play(CROAK_ANIM);
                }
            } else if (!this.sprite.anims.isPlaying) {
                this.sprite.anims.play(IDLE_ANIM);
                this.sprite.setOrigin(0.5);
            }
        }
    }

}