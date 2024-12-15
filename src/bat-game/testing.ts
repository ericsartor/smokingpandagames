import { Phaser } from './barrel';
import { BatPlayer } from './entities/bat';
import { Fish } from './entities/fish';
import { Fly } from './entities/fly';
import { Frog } from './entities/frog';
import { Sheep } from './entities/sheep';
import { Water } from './entities/water';
import { ExtendedSprite } from './types/util';
import { getCameraBox, getScreenBasedPixels, getScreenBasedSpeed, iterateGroupChildren, scaleBasedOnCamera, setScreenBasedGravity } from './utils';

const SHEEP_SCALE = 0.1;
const SHEEP_SPEED_RANGE_MIN = 0.2;
const SHEEP_SPEED_RANGE_MAX = 0.7;
const SHEEP_SPAWN_RATE = 1500;

type Sprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class Testing extends Phaser.Scene {

    player: BatPlayer | null = null;
    energyBar: Phaser.GameObjects.Rectangle | null = null;
    maxEnergyBarWidth: number = 0;
    dashBar: Phaser.GameObjects.Rectangle | null = null;
    maxDashBarWidth: number = 0;
    playerColliders: Phaser.Physics.Arcade.Collider[] = [];

    sheeps: Phaser.GameObjects.Group | null = null;
    sheepCount: Phaser.GameObjects.Text | null = null;
    platforms: Phaser.GameObjects.Group | null = null;
    
    hitCount: number = 0;
    missCount: number = 0;
    hitMissText: Phaser.GameObjects.Text | null = null;
    hitSheepBuffer = new Set<Sprite>();
    
    water: Water | null = null;;

    lastFishTime = 0;
    fish: Fish[] = []

    frog: Frog | null = null;

    food: ExtendedSprite[] = [];
    foodGroup: Phaser.GameObjects.Group | null = null;

    gameOverStartedTime = 0;
    gameOverShowText = false;
    gameOverStarted = false;

    constructor() {
        super('Testing');
    }

    init() {
        this.player = null;
        this.energyBar = null;
        this.maxEnergyBarWidth = 0;
        this.dashBar = null;
        this.maxDashBarWidth = 0;
        this.playerColliders = [];
        this.sheeps = null;
        this.sheepCount = null;
        this.platforms = null;
        this.hitCount = 0;
        this.missCount = 0;
        this.hitMissText = null;
        this.hitSheepBuffer = new Set<Sprite>();
        this.water = null;;
        this.lastFishTime = 0;
        this.fish = []
        this.frog = null;
        this.food = [];
        this.foodGroup = null;
        this.gameOverStartedTime = 0;
        this.gameOverShowText = false;
        this.gameOverStarted = false;
    }

    preload() {
        this.load.baseURL = '/bat-game';
        this.load.image('sky', '/backgrounds/sky.png');
        this.load.image('cliff_right', '/backgrounds/cliff_right.png');
    }

    create() {

        // Initialize gravity
        setScreenBasedGravity(this, 0, 1);

        // Set up background
        const sky = this.add.image(0, 0, 'sky');
        sky.setDepth(-Infinity);
        sky.width = getScreenBasedPixels(this, 1, 'width');

        // Create platform group
        const platformGroup = this.add.group();
        this.platforms = platformGroup;

        // Set up cliffs
        const jutOut = SHEEP_SCALE * this.cameras.main.width;
        const leftPlatform = this.physics.add.image(0, 0, 'cliff_right');
        leftPlatform.setFlipX(true);
        const rightPlatform = this.physics.add.image(0, 0, 'cliff_right');
        const camBox = getCameraBox(this);
        [leftPlatform, rightPlatform].forEach((platform) => {
            platform.body.setAllowGravity(false);
            platform.setPushable(false);
            platformGroup.add(platform);
            platform.y = camBox.top + jutOut;
            scaleBasedOnCamera(this, platform, 0.25);
            platform.setSize(
                platform.width,
                getScreenBasedPixels(this, 0.05, 'height'),
            );
            platform.setOffset(
                0,
                getScreenBasedPixels(this, 0.01, 'height'),
            );
        });
        leftPlatform.setOrigin(0, 0);
        leftPlatform.x = camBox.left;
        rightPlatform.setOrigin(1, 0);
        rightPlatform.x = camBox.right;

        // Set up food group
        const foodGroup = this.add.group();
        this.foodGroup = foodGroup;

        // Create bat player
        this.player = new BatPlayer(this, 0, 0, {
            baseSpeed: 0.3,
            dashSpeed: 0.6,
            dashDuration: 0.5,
            dashFrequency: 3,
            food: this.food,
            foodGroup,
            energyPerFood: 150,
            maxEnergy: 1000,
            energyLossPerSecond: 100,
        });

        // Set up camera
        this.cameras.main.centerOn(0, 0);

        // Create sheep group
        this.sheeps = this.add.group();

        // Create water
        this.water = new Water(this, 0, 0);
        this.water.registerSplashCollision(this.player.sprite);

        // Set up collision for sheep and platforms
        this.physics.add.collider(this.sheeps, this.platforms);

        // Set up energy bar
        const padding = 10;
        this.maxEnergyBarWidth = getScreenBasedPixels(this, 0.33, 'width');
        const energyBarHeight = getScreenBasedPixels(this, 0.05, 'height');
        const energyBarX = camBox.right - padding;
        const energyBarY = camBox.top + padding;
        const energyBarOutline = this.add.rectangle(
            energyBarX - 1,
            energyBarY - 1,
            this.maxEnergyBarWidth + 2,
            energyBarHeight + 2,
            0x000000,
        );
        energyBarOutline.setOrigin(1, 0);
        this.energyBar = this.add.rectangle(
            energyBarX,
            energyBarY,
            this.maxEnergyBarWidth,
            energyBarHeight,
            0x00ff00,
        );
        this.energyBar.setOrigin(1, 0);

        // Set up dash bar
        this.maxDashBarWidth = getScreenBasedPixels(this, 0.1, 'width');
        const dashBarHeight = getScreenBasedPixels(this, 0.025, 'height');
        const dashBarX = camBox.right - padding;
        const dashBarY = energyBarY + energyBarHeight + padding;
        const dashBarOutline = this.add.rectangle(
            dashBarX - 1,
            dashBarY - 1,
            this.maxDashBarWidth + 2,
            dashBarHeight + 2,
            0x000000,
        );
        dashBarOutline.setOrigin(1, 0);
        this.dashBar = this.add.rectangle(
            dashBarX,
            dashBarY,
            this.maxDashBarWidth,
            dashBarHeight,
            0xff0000,
        );
        this.dashBar.setOrigin(1, 0);

        this.frog = new Frog(this, 0, getScreenBasedPixels(this, 0.39, 'height'), {
            scale: 0.07,
        });

    }

    lastSheepTime = 0;
    createMoreSheep(time: number) {
        if (this.lastSheepTime === 0) {
            this.lastSheepTime = time;
            return;
        }
        if (!this.player || !this.sheeps || !this.platforms) return;
        if (time - this.lastSheepTime > SHEEP_SPAWN_RATE) {
            // Generate sheep info
            const size = 0.1;
            const side = Math.random() >= 0.5 ? 'right' : 'left';
            const speed = Phaser.Math.Between(
                getScreenBasedSpeed(this, SHEEP_SPEED_RANGE_MIN),
                getScreenBasedSpeed(this, SHEEP_SPEED_RANGE_MAX),
            );
            const camBox = getCameraBox(this);
            const sheepWidth = getScreenBasedPixels(this, 0.1, 'width');
            const x = side === 'left' ? (camBox.left - sheepWidth) : (camBox.right + sheepWidth);
            const platform = this.platforms.getChildren()[0] as Sprite;
            const y = platform.y - sheepWidth;

            // Create sheep
            const sheep = new Sheep(this, x, y, {
                direction: side === 'left' ? 'right' : 'left',
                size,
                speed,
            });

            // Set up splash
            if (this.water) {
                this.water.registerSplashCollision(sheep.sprite);
            }

            // Set up sheep collision with player
            let collider: Phaser.Physics.Arcade.Collider | null = null;
            collider = this.physics.add.collider(sheep.sprite, this.player.sprite, () => {
                if (!this.player) return;
                const playerBodyDiameter = this.player.sprite.body.height;
                const playerRadius = playerBodyDiameter / 2;
                const sheepBoxX = sheep.sprite.body.x;
                const playerBoxX = this.player.sprite.body.x;
                const sheepBoxY = sheep.sprite.body.y;
                const playerBoxY = this.player.sprite.body.y;
                const sheepVelocityX = sheep.sprite.body.velocity.x;
                const sheepVelocityY = sheep.sprite.body.velocity.y;

                const playerTopY = playerBoxY - playerRadius;
                const percentY = Math.abs((((sheepBoxY - playerTopY) / (playerBodyDiameter)) - 0.5) * 2);
                sheep.sprite.setVelocityX(-(sheepVelocityX * percentY));

                const playerLeftX = playerBoxX - playerRadius;
                const percentX = Math.abs((((sheepBoxX - playerLeftX) / (playerBodyDiameter)) - 0.5) * 2);
                sheep.sprite.setVelocityY(-(sheepVelocityY * percentX));
                
                // Remove collision
                if (collider)this.physics.world.removeCollider(collider);
            });
            if (collider) this.player.colliders.push(collider);

            // Track sheep
            this.sheeps.add(sheep.sprite);
            this.lastSheepTime = time;
            this.player.registerDamageSprite(sheep.sprite, 50, false);
        }
    }
    cullSheep() {
        if (!this.sheeps) return;
        const camBox = getCameraBox(this);
        iterateGroupChildren<Sprite>(this.sheeps, (sheep) => {
            if (sheep.y > camBox.bottom + (sheep.height / 2)) {
                if (!this.hitSheepBuffer.has(sheep)) {
                    this.missCount++;
                }
                sheep.destroy();
            }
        });
    }

    createFood(time: number) {
        if (this.foodGroup === null) return;
        if (this.player === null) return;
        if (this.food.length < 1) {
            const xMult = this.player.sprite.x > 0 ? -1 : 1;
            const foodX = xMult * Phaser.Math.Between(0, getScreenBasedPixels(this, 0.4, 'width'));
            const yMult = this.player.sprite.y > 0 ? -1 : 1;
            const foodY = yMult * Phaser.Math.Between(0, getScreenBasedPixels(this, 0.35, 'height'));
            const food = new Fly(this, foodX, foodY, {
                createdTime: time,
                hitBoxStyle: 'normal',
            });
            this.food.push(food);
            this.foodGroup.add(food.sprite);
        }
    }

    createFish(time :number) {
        this.lastFishTime = time;
        const lastFish = this.fish[this.fish.length - 1];
        const camBox = getCameraBox(this);
        const direction = lastFish?.sprite.x > camBox.x ? 'right' : 'left';
        const depth = lastFish?.depth === 0 ? -1 : 0;
        const fishX = direction === 'right'
            ? Phaser.Math.Between(camBox.left, camBox.left + camBox.width * 0.25)
            : Phaser.Math.Between(camBox.right - camBox.width * 0.25, camBox.right);
        const fishY = getScreenBasedPixels(this, 0.54, 'height')
        const fish = new Fish(this, fishX, fishY, {
            upTime: 2,
            downTime: 2,
            stayTime: 0.1,
            startTime: time,
            direction,
            depth,
            color: 'yellow',
            spitHandler: (spit: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
                if (!this.player) return;
                this.player.registerDamageSprite(spit, 25, true);
            },
        });
        this.fish.push(fish);
    }

    updateEnergyBar() {
        if (this.player === null) return;
        if (this.energyBar === null) return;
        this.energyBar.width = this.player.energy / this.player.maxEnergy * this.maxEnergyBarWidth;
    }

    updateDashBar(time: number) {
        if (this.player === null) return;
        if (this.dashBar === null) return;
        const total = this.player.nextDashAvailable - this.player.dashEnd;
        const remaining = this.player.nextDashAvailable - time;
        const percent = Math.max(0, Math.min(1, remaining / total));
        this.dashBar.width = percent * this.maxDashBarWidth;
    }

    checkGameOver(time: number) {
        if (this.player === null) return;
        if (this.player.energy <= 0 && this.gameOverStartedTime === 0) {
            this.gameOverStartedTime = time; 
        }
        if (this.gameOverStartedTime !== 0 && time - this.gameOverStartedTime > 2000) {
            const fadeDuration = 2000;
            if (!this.gameOverStarted) {
                this.gameOverStarted = true;
                const rectangle = this.add.rectangle(0, 0, this.game.canvas.width, this.game.canvas.height, 0x000000).setDepth(10);
                rectangle.alpha = 0;
                this.tweens.add({
                    targets: rectangle,
                    alpha: 1, // Set the final alpha value to 1 (fully opaque)
                    duration: fadeDuration, // Fade-in duration in milliseconds
                    ease: 'Linear' // Linear easing for a smooth fade-in
                });
            }
            if (!this.gameOverShowText && time - this.gameOverStartedTime > fadeDuration + 2000) {
                this.gameOverShowText = true;
                this.add.text(0, 0, 'Game Over').setOrigin(0.5, 0.5).setDepth(10);
                this.add.text(0, getScreenBasedPixels(this, 0.1, 'height'), 'Play Again').setInteractive().setDepth(10).on('pointerdown', () => {
                    this.scene.restart();
                });
            }
        }
    }

    update(time: number) {
        // Energy bar
        this.updateEnergyBar();

        // Dash bar
        this.updateDashBar(time);

        // Create food
        this.createFood(time);

        if (this.player) {
            this.createMoreSheep(time);
        }
        if (this.sheeps) {
            this.cullSheep();
            if (this.sheepCount) {
                this.sheepCount.setText(`Sheeps: ${this.sheeps.getLength()}`);
            }
        }

        // Update Hit/Miss counter
        this.hitMissText?.setText(`Hits: ${this.hitCount}, Misses: ${this.missCount}`);

        // Create fish
        if (time - this.lastFishTime > 2000) {
            this.createFish(time);
        }
        if (this.fish && this.player) {
            this.fish = this.fish.filter((f) => !f.done);
        }

        // Move frog
        if (this.frog) {
            const frogInterval = 12000;
            let position = (time % frogInterval) / frogInterval;
            if (position > 0.5) {
                position = 0.5 - (position - 0.5);
            }
            position = position * 2;
            const trackWidth = getScreenBasedPixels(this, 0.8, 'width');
            this.frog.moveFrogX(position * trackWidth - (trackWidth / 2));
        }

        this.checkGameOver(time);
    }

}