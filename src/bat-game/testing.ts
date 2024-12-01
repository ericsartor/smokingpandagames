import { Phaser } from './barrel';
import { BatPlayer } from './entities/bat';
import { Fish } from './entities/fish';
import { Fly } from './entities/fly';
import { Sheep } from './entities/sheep';
import { ExtendedSprite } from './types/util';
import { getCameraBox, getScreenBasedPixels, getScreenBasedSpeed, iterateGroupChildren, scaleBasedOnCamera, scaleTileBasedOnCamera, setScreenBasedGravity } from './utils';

const SHEEP_SCALE = 0.1;
const SHEEP_SPEED_RANGE_MIN = 0.2;
const SHEEP_SPEED_RANGE_MAX = 0.7;
const SHEEP_SPAWN_RATE = 700;

type Sprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type Tile = Phaser.GameObjects.TileSprite;

export class Testing extends Phaser.Scene {

    player: BatPlayer | null = null;
    energyBar: Phaser.GameObjects.Rectangle | null = null;
    maxEnergyBarWidth: number = 0;
    dashBar: Phaser.GameObjects.Rectangle | null = null;
    maxDashBarWidth: number = 0;

    sheeps: Phaser.GameObjects.Group | null = null;
    sheepCount: Phaser.GameObjects.Text | null = null;
    platforms: Phaser.GameObjects.Group | null = null;
    
    hitCount: number = 0;
    missCount: number = 0;
    hitMissText: Phaser.GameObjects.Text | null = null;
    hitSheepBuffer = new Set<Sprite>();
    
    waters: Phaser.GameObjects.Group | null = null;

    lastFishTime = 0;
    fish: Fish[] = []

    food: ExtendedSprite[] = [];
    foodGroup: Phaser.GameObjects.Group | null = null;

    constructor() {
        super('Testing');
    }

    preload() {
        this.load.baseURL = '/bat-game';
        this.load.image('water', '/water.png');
        this.load.image('sky', '/backgrounds/sky.png');
        this.load.image('cliff_right', '/backgrounds/cliff_right.png');
    }

    create() {

        // Initialize gravity
        setScreenBasedGravity(this, 0, 1);

        // Set up background
        const sky = this.add.image(0, 0, 'sky');
        sky.setDepth(-Infinity)

        // Create platform group
        const platformGroup = this.add.group();
        this.platforms = platformGroup;

        // Set up cliffs
        const jutOut = SHEEP_SCALE * this.cameras.main.width;
        const leftPlatform = this.physics.add.image(0, 0, 'cliff_right');
        leftPlatform.setFlipX(true);
        const rightPlatform = this.physics.add.image(0, 0, 'cliff_right');
        const camBox = getCameraBox(this);
        [leftPlatform, rightPlatform].forEach((platform, index) => {
            platform.body.setAllowGravity(false);
            platform.setPushable(false);
            platformGroup.add(platform);
            platform.y = camBox.top + jutOut;
            platform.setSize(
                getScreenBasedPixels(this, 2, 'width'),
                getScreenBasedPixels(this, 0.05, 'height'),
            );
            platform.setOffset(
                getScreenBasedPixels(this, index === 0 ? -0.9 : 0, 'width'),
                getScreenBasedPixels(this, 0.01, 'height'),
            );
            scaleBasedOnCamera(this, platform, 0.25);
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
            boostSpeed: 0.6,
            boostDuration: 0.5,
            boostFrequency: 3,
            food: this.food,
            foodGroup,
            energyPerFood: 150,
            maxEnergy: 1000,
            energyLossPerSecond: 50,
        });

        // Set up camera
        this.cameras.main.centerOn(0, 0);

        // Create sheep group
        this.sheeps = this.add.group();

        // Create water
        const waterStartY = getScreenBasedPixels(this, 0.42, 'height');
        const waterWidth = getScreenBasedPixels(this, 1, 'width');
        this.waters = this.add.group([
            this.add.tileSprite(
                0,
                waterStartY,
                waterWidth,
                0,
                'water',
            ),
            this.add.tileSprite(
                0,
                waterStartY + (getScreenBasedPixels(this, 0.02, 'height')),
                waterWidth,
                0,
                'water',
            ),
            this.add.tileSprite(
                0,
                waterStartY + (getScreenBasedPixels(this, 0.04, 'height')),
                waterWidth,
                0,
                'water',
            ),
        ]);
        iterateGroupChildren<Tile>(this.waters, (water, index, arr) => {
            scaleTileBasedOnCamera(this, water, 0.25);
            water.setOrigin(0.5, 0);
            if (index === arr.length - 1) {
                water.setDepth(1);
            } else {
                water.setDepth(-1);
            }
        });

        // Set up collision for sheep and platforms, also sheep and player
        this.physics.add.collider(this.sheeps, this.platforms);
        this.physics.add.collider(this.sheeps, this.player.sprite, (sheep) => {
            const sprite = sheep as Sprite;
            if (this.hitSheepBuffer.has(sprite)) return;
            this.hitCount++;
            this.hitSheepBuffer.add(sprite);
        });

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

        // Set up boost bar
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

            // Track sheep
            this.sheeps.add(sheep.sprite);
            this.lastSheepTime = time;
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

    updateEnergyBar() {
        if (this.player === null) return;
        if (this.energyBar === null) return;
        this.energyBar.width = this.player.energy / this.player.maxEnergy * this.maxEnergyBarWidth;
    }

    updateDashBar(time: number) {
        if (this.player === null) return;
        if (this.dashBar === null) return;
        const total = this.player.nextBoostAvailable - this.player.boostEnd;
        const remaining = this.player.nextBoostAvailable - time;
        const percent = Math.max(0, Math.min(1, remaining / total));
        this.dashBar.width = percent * this.maxDashBarWidth;
    }

    checkGameOver() {
        if (this.player === null) return;
        if (this.player.energy <= 0) {
            // TODO: do game over sequence
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

        if (this.waters) {
            const maxSpeed = getScreenBasedSpeed(this, 0.003);
            const speed = maxSpeed * (Math.sin(time * 0.002));
            iterateGroupChildren<Tile>(this.waters, (water, index) => {
                const mult = index % 2 === 0 ? -1 : 1;
                water.tilePositionX += speed * mult;
            });
        }

        // Update Hit/Miss counter
        this.hitMissText?.setText(`Hits: ${this.hitCount}, Misses: ${this.missCount}`);

        // Create fish
        if (time - this.lastFishTime > 1000) {
            this.lastFishTime = time;
            const direction = Math.random() > 0.5 ? 'right' : 'left';
            const camBox = getCameraBox(this);
            const fishX = direction === 'right'
                ? Phaser.Math.Between(camBox.left, camBox.left + camBox.width * 0.25)
                : Phaser.Math.Between(camBox.right - camBox.width * 0.25, camBox.right);
            const fishY = getScreenBasedPixels(this, 0.54, 'height')
            this.fish.push(new Fish(this, fishX, fishY, {
                upTime: 2,
                downTime: 2,
                stayTime: 0.1,
                startTime: time,
                direction,
                color: 'yellow',
            }));
        }
        if (this.fish && this.player) {
            this.fish = this.fish.filter((f) => !f.done);
        }
    }

}