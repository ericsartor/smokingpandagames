import { registerCreateFunc, registerLoadFunc } from "../loading";
import { ExtendedSprite } from "../types/util";
import { getScreenBasedPixels, getScreenBasedSpeed, scaleBasedOnCamera } from "../utils";

const batFrameWidth = 808;
const batFrameHeight = 522;

const IDLE_SHEET = 'sprite-bat-right';
const PANICKED_SHEET = 'sprite-bat-panicked-right';
const OPEN_MOUTH_PANIC_SHEET = 'sprite-bat-open-mouth-panic-right';
const CHEWING_PANIC_SHEET = 'sprite-bat-chewing-panic-right';
const OPEN_MOUTH_SHEET = 'sprite-bat-open-mouth-right';
const CHEWING_SHEET = 'sprite-bat-chewing-right';
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
    
    // Load spritesheet for chewing
    scene.load.spritesheet(CHEWING_SHEET, '/bat/bat_chewing_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
    
    // Load spritesheet for open mouth + panic
    scene.load.spritesheet(OPEN_MOUTH_PANIC_SHEET, '/bat/bat_open_mouth_panic_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
    
    // Load spritesheet for chewing + panic
    scene.load.spritesheet(CHEWING_PANIC_SHEET, '/bat/bat_chewing_panic_sheet.png', {
        frameWidth: batFrameWidth,
        frameHeight: batFrameHeight,
    });
});

const ANIM_LENGTH = 4;
const IDLE_FRAME_RATE = 9;
const PANICKED_FRAME_RATE = 11;
const IDLE_ANIM = 'anim-bat-right';
const OPEN_MOUTH_PANIC_ANIM = 'anim-bat-open-mouth-panic-right';
const CHEWING_PANIC_ANIM = 'anim-bat-chewing-panic-right';
const PANICKED_ANIM = 'anim-bat-panicked-right';
const OPEN_MOUTH_ANIM = 'anim-bat-open-mouth-right';
const CHEWING_ANIM = 'anim-bat-chewing-right';
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

    // Set up panicked animation
    scene.anims.create({
        key: PANICKED_ANIM,
        frameRate: PANICKED_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(PANICKED_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(PANICKED_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up open mouth animation
    scene.anims.create({
        key: OPEN_MOUTH_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up chewing animation
    scene.anims.create({
        key: CHEWING_ANIM,
        frameRate: IDLE_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(CHEWING_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(CHEWING_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up open mouth + panic animation
    scene.anims.create({
        key: OPEN_MOUTH_PANIC_ANIM,
        frameRate: PANICKED_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_PANIC_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(OPEN_MOUTH_PANIC_SHEET, { start: 1, end: 1 }),
        ],
    });

    // Set up chewing + panic animation
    scene.anims.create({
        key: CHEWING_PANIC_ANIM,
        frameRate: PANICKED_FRAME_RATE,
        repeat: -1,
        frames: [
            ...scene.anims.generateFrameNumbers(CHEWING_PANIC_SHEET, { start: 0, end: 2 }),
            ...scene.anims.generateFrameNumbers(CHEWING_PANIC_SHEET, { start: 1, end: 1 }),
        ],
    });
});

type BatPlayerOptions = {
    baseSpeed: number;
    boostSpeed: number;
    food: ExtendedSprite[];
    foodGroup: Phaser.GameObjects.Group;
    energyPerFood: number;
    maxEnergy: number;
    energyLossPerSecond: number;
};
export class BatPlayer {

    scene: Phaser.Scene;
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    baseSpeed: number;
    boostSpeed: number;
    food: ExtendedSprite[];
    foodGroup: Phaser.GameObjects.Group;
    chewing = false;
    endChewing: number | null = null;
    currentTime = 0;
    maxEnergy: number;
    energy: number;
    energyPerFood: number;
    energyLossPerSecond: number;

    constructor(scene: Phaser.Scene, x: number, y: number, options: BatPlayerOptions) {
        // Store scene
        this.scene = scene;

        // Register updates
        scene.events.on('update', this.update, this);

        // Create physics sprite
        this.sprite = this.scene.physics.add.sprite(0, 0, 'sprite-bat-right', 0);
        this.sprite.body.setAllowGravity(false);
        this.sprite.setBounce(1);
        this.sprite.body.setCircle(this.sprite.width * 0.25, this.sprite.width * 0.25, this.sprite.height * 0.06);
        this.sprite.x = x;
        this.sprite.y = y;
        scaleBasedOnCamera(this.scene, this.sprite, 0.15);

        // Store speed
        this.baseSpeed = options.baseSpeed;
        this.boostSpeed = options.boostSpeed;

        // Handle food
        this.energyLossPerSecond = options.energyLossPerSecond;
        this.maxEnergy = options.maxEnergy;
        this.energy = this.maxEnergy;
        this.energyPerFood = options.energyPerFood;
        this.food = options.food;
        this.foodGroup = options.foodGroup;
        this.scene.physics.add.collider(this.sprite, this.foodGroup, (_, food) => {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyPerFood);
            food.destroy();
            const foodIndex = this.food.findIndex((f) => f.sprite === food);
            if (foodIndex !== -1) {
                this.food.splice(foodIndex, 1);
            }
            this.chewing = true;
            this.endChewing = this.currentTime + 1000;
        });
    }

    update(time: number, deltaMs: number) {
        // Update time
        this.currentTime = time;

        const deltaSeconds = deltaMs / 1000;

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

            // Handle energy
            this.energy = Math.max(0, this.energy - (this.energyLossPerSecond * deltaSeconds * (isBoosting ? 2 : 1)));

            // Check food proximity
            const openMouthDistance = getScreenBasedPixels(this.scene, 0.1, 'width');
            const nearFood = this.food.some((food) => {
                const between = Phaser.Math.Distance.BetweenPoints(food, this.sprite);
                return between <= openMouthDistance && (
                    (isMovingLeft && food.x < this.sprite.x) || (isMovingRight && food.x > this.sprite.x) || (!isMovingLeft || !isMovingRight)
                );
            });
            
            // Handle chewing
            if (this.chewing && this.endChewing !== null) {
                if (this.endChewing <= time) {
                    this.chewing = false;
                    this.endChewing = null;
                }
            }

            // Handle animation
            const anim = (() => {
                if (isBoosting) {
                    if (nearFood) return OPEN_MOUTH_PANIC_ANIM;
                    if (this.chewing) return CHEWING_PANIC_ANIM;
                    return PANICKED_ANIM
                }
                if (nearFood) return OPEN_MOUTH_ANIM;
                if (this.chewing) return CHEWING_ANIM;
                return IDLE_ANIM;
            })();
            const currentAnimFrame = this.sprite.anims.currentFrame !== null ? (this.sprite.anims.currentFrame.index % ANIM_LENGTH) : null;
            const changingAnims = this.sprite.anims.currentAnim ? this.sprite.anims.currentAnim.key !== anim : false;
            this.sprite.anims.play({
                key: anim,
                startFrame: (changingAnims && currentAnimFrame !== null) ? currentAnimFrame : undefined,
            }, true);
            
            // Choose speed
            const speed = getScreenBasedSpeed(this.scene, isBoosting ? this.boostSpeed : this.baseSpeed);
            
            // Horizontal movement
            if (isMovingLeft) {
                this.sprite.setFlipX(true);
                this.sprite.setVelocityX(-speed);
            } else if (isMovingRight) {
                this.sprite.setFlipX(false);
                this.sprite.setVelocityX(speed);
            } else {
                this.sprite.setVelocityX(0);
            }

            // Vertical movement
            if (isMovingUp) {
                this.sprite.setVelocityY(-speed);
            } else if (isMovingDown) {
                this.sprite.setVelocityY(speed);
            } else {
                this.sprite.setVelocityY(0);
            }
        }
    }

}