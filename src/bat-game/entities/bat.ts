import { Phaser } from "../barrel";
import { registerCreateFunc, registerLoadFunc } from "../loading";
import { getScreenBasedPixels, getScreenBasedSpeed, scaleBasedOnCamera } from "../utils";

const batFrameWidth = 808;
const batFrameHeight = 522;

const IDLE_SHEET = 'sprite-bat-right';
const PANICKED_SHEET = 'sprite-bat-panicked-right';
const OPEN_MOUTH_SHEET = 'sprite-bat-open-mouth-right';
registerLoadFunc((scene: Phaser.Scene) => {
    // Load spritesheet for idle
    scene.load.spritesheet(IDLE_SHEET, '/bat/bat_idle_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
    
    // Load spritesheet for panicked
    scene.load.spritesheet(PANICKED_SHEET, '/bat/bat_panicked_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
    
    // Load spritesheet for open mouth
    scene.load.spritesheet(OPEN_MOUTH_SHEET, '/bat/bat_open_mouth_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
});

const ANIM_LENGTH = 4;
const IDLE_FRAME_RATE = 9;
const PANICKED_FRAME_RATE = 11;
const IDLE_ANIM = 'anim-bat-right';
const PANICKED_ANIM = 'anim-bat-panicked-right';
const OPEN_MOUTH_ANIM = 'anim-bat-open-mouth-right';
registerCreateFunc((scene: Phaser.Scene) => {
    // Set up flying animation
    scene.anims.create({
        key: IDLE_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(IDLE_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up panicked flying animation
    scene.anims.create({
        key: PANICKED_ANIM,
        frameRate: PANICKED_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(PANICKED_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(PANICKED_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up open mouth flying animation
    scene.anims.create({
        key: OPEN_MOUTH_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_SHEET, { start: 1, end: 1 }),
        ],
    });
});

type BatPlayerOptions = {
    baseSpeed: number;
    boostSpeed: number;
    food: Phaser.Types.Math.Vector2Like[];
};
export class BatPlayer {

    scene: Phaser.Scene;
    bat: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    baseSpeed: number;
    boostSpeed: number;
    food: { x: number, y: number }[];

    constructor(scene: Phaser.Scene, x: number, y: number, options: BatPlayerOptions) {
        // Store scene
        this.scene = scene;

        // Register updates
        scene.events.on('update', this.update, this);

        // Create physics sprite
        this.bat = this.scene.physics.add.sprite(0, 0, 'sprite-bat-right', 0);
        this.bat.body.setAllowGravity(false);
        this.bat.setBounce(1);
        this.bat.body.setCircle(this.bat.width * 0.25, this.bat.width * 0.25, this.bat.height * 0.06);
        this.bat.x = x;
        this.bat.y = y;
        scaleBasedOnCamera(this.scene, this.bat, 0.15);

        // Store speed
        this.baseSpeed = options.baseSpeed;
        this.boostSpeed = options.boostSpeed;

        // Store food
        this.food = options.food;
    }

    update() {
        // Handle input
        if (this.scene.input.keyboard) {
            // Define inputs
            const controls = this.scene.input.keyboard.createCursorKeys();
            const boost = this.scene.input.keyboard.addKey('SPACE');

            // Decide if boosting
            const isBoosting = boost.isDown;
            const isMovingLeft = controls.left.isDown && !controls.right.isDown;
            const isMovingRight = !controls.left.isDown && controls.right.isDown;
            const isMovingUp = controls.up.isDown && !controls.down.isDown;
            const isMovingDown = !controls.up.isDown && controls.down.isDown;

            // Check food proximity
            const openMouthDistance = getScreenBasedPixels(this.scene, 0.1, 'width');
            const nearFood = this.food.some((food) => {
                const between = Phaser.Math.Distance.BetweenPoints(food, this.bat);
                return between <= openMouthDistance && (
                    (isMovingLeft && food.x < this.bat.x) || (isMovingRight && food.x > this.bat.x)
                );
            });
            
            // Handle animation
            const anim = (() => {
                if (nearFood) return OPEN_MOUTH_ANIM;
                if (isBoosting) return PANICKED_ANIM
                return IDLE_ANIM;
            })();
            const currentAnimFrame = this.bat.anims.currentFrame !== null ? (this.bat.anims.currentFrame.index % ANIM_LENGTH) : null;
            const changingAnims = this.bat.anims.currentAnim ? this.bat.anims.currentAnim.key !== anim : false;
            this.bat.anims.play({
                key: anim,
                startFrame: (changingAnims && currentAnimFrame !== null) ? currentAnimFrame : undefined,
            }, true);
            
            // Choose speed
            const speed = getScreenBasedSpeed(this.scene, isBoosting ? this.boostSpeed : this.baseSpeed);
            
            // Horizontal movement
            if (isMovingLeft) {
                this.bat.setFlipX(true);
                this.bat.setVelocityX(-speed);
            } else if (isMovingRight) {
                this.bat.setFlipX(false);
                this.bat.setVelocityX(speed);
            } else {
                this.bat.setVelocityX(0);
            }

            // Vertical movement
            if (isMovingUp) {
                this.bat.setVelocityY(-speed);
            } else if (isMovingDown) {
                this.bat.setVelocityY(speed);
            } else {
                this.bat.setVelocityY(0);
            }
        }
    }

}