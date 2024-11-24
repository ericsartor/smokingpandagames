import { Phaser } from './barrel';
import { BatPlayer } from './entities/bat';
import { Fish } from './entities/fish';
import { Fly } from './entities/fly';
import { createSheep, loadSheep } from './entities/sheep';
import { ExtendedSprite } from './types/util';
import { getCameraBox, getScreenBasedPixels, getScreenBasedSpeed, getSpriteBox, iterateGroupChildren, scaleBasedOnCamera, scaleTileBasedOnCamera, setScreenBasedGravity } from './utils';

const SHEEP_SCALE = 0.1;
const SHEEP_SPEED_RANGE_MIN = 0.2;
const SHEEP_SPEED_RANGE_MAX = 0.7;
const SHEEP_SPAWN_RATE = 700;

type Sprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type Tile = Phaser.GameObjects.TileSprite;

export class Testing extends Phaser.Scene {

    player: BatPlayer | null = null;
    sheeps: Phaser.GameObjects.Group | null = null;
    sheepCount: Phaser.GameObjects.Text | null = null;
    platforms: Phaser.GameObjects.Group | null = null;
    
    hitCount: number = 0;
    missCount: number = 0;
    hitMissText: Phaser.GameObjects.Text | null = null;
    hitSheepBuffer = new Set<Sprite>();
    
    waters: Phaser.GameObjects.Group | null = null;
    waterMaxSpeed = 0.005;

    lastFishTime = 0;
    fish: Fish[] = []

    food: ExtendedSprite[] = [];
    foodGroup: Phaser.GameObjects.Group | null = null;

    constructor() {
        super('Testing');
    }

    preload() {
        this.load.baseURL = '/bat-game';
        this.load.image('test-platform', '/test-assets/platform.png');
        this.load.image('water', '/water.png');
        loadSheep(this);
    }

    create() {

        // Initialize gravity
        setScreenBasedGravity(this, 0, 1);

        // Set up food group
        const foodGroup = this.add.group();
        this.foodGroup = foodGroup;

        // Create bat player
        this.player = new BatPlayer(this, 0, 0, {
            baseSpeed: 0.3,
            boostSpeed: 0.6,
            food: this.food,
            foodGroup,
        });

        // Set up camera
        this.cameras.main.centerOn(0, 0);

        // Create sheep group
        this.sheeps = this.add.group();

        // Create water
        const waterStartY = getScreenBasedPixels(this, 0.35, 'height');
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

        // Create platform group
        const platformGroup = this.add.group();
        this.platforms = platformGroup;

        // Set up test platforms
        const jutOut = SHEEP_SCALE * this.cameras.main.width;
        const leftPlatform = this.physics.add.image(0, 0, 'test-platform');
        const rightPlatform = this.physics.add.image(0, 0, 'test-platform');
        [leftPlatform, rightPlatform].forEach((platform) => {
            platform.body.setAllowGravity(false);
            platform.setPushable(false);
            platformGroup.add(platform);
        });
        const camBox = getCameraBox(this);
        scaleBasedOnCamera(this, leftPlatform, 0.2);
        leftPlatform.setOrigin(1, 0);
        leftPlatform.x = camBox.left + jutOut;
        leftPlatform.y = camBox.top + jutOut;
        scaleBasedOnCamera(this, rightPlatform, 0.2);
        rightPlatform.setOrigin(0, 0);
        rightPlatform.x = camBox.right - jutOut;
        rightPlatform.y = camBox.top + jutOut;

        // Set up collision for sheep and platforms, also sheep and player
        this.physics.add.collider(this.sheeps, this.platforms);
        this.physics.add.collider(this.sheeps, this.player.sprite, (sheep) => {
            const sprite = sheep as Sprite;
            if (this.hitSheepBuffer.has(sprite)) return;
            this.hitCount++;
            this.hitSheepBuffer.add(sprite);
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
            // Create sheep
            const sheep = createSheep(this);

            // Scale
            scaleBasedOnCamera(this, sheep, SHEEP_SCALE);
            
            // Pick side
            const side = Math.random() >= 0.5 ? 'right' : 'left';

            // Set location/speed/direction
            const sheepBox = getSpriteBox(sheep);
            const camBox = getCameraBox(this);
            const speed = Phaser.Math.Between(
                getScreenBasedSpeed(this, SHEEP_SPEED_RANGE_MIN),
                getScreenBasedSpeed(this, SHEEP_SPEED_RANGE_MAX),
            );
            if (side === 'left') {
                sheep.x = camBox.left - sheepBox.width;
                sheep.setVelocityX(speed);
                sheep.setFlipX(true);
            } else {
                sheep.x = camBox.right + sheepBox.width;
                sheep.setVelocityX(-speed);
            }
            const platform = this.platforms.getChildren()[0] as Sprite;
            if (platform) {
                sheep.y = platform.y - sheepBox.height / 2;
            } else {
                sheep.y = camBox.top;
            }
            sheep.setBounce(0);
            this.sheeps.add(sheep);
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
            const foodY = yMult * Phaser.Math.Between(0, getScreenBasedPixels(this, 0.4, 'height'));
            const food = new Fly(this, foodX, foodY, {
                createdTime: time,
            });
            this.food.push(food);
            this.foodGroup.add(food.sprite);
        }
    }

    update(time: number, deltaMs: number) {
        const deltaSeconds = deltaMs / 1000;

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
            const maxSpeed = getScreenBasedSpeed(this, this.waterMaxSpeed);
            const speed = maxSpeed * (Math.sin(time * 0.001));
            iterateGroupChildren<Tile>(this.waters, (water, index) => {
                const mult = index % 2 === 0 ? -1 : 1;
                water.tilePositionX += speed * mult;
            });
        }

        // Update Hit/Miss counter
        this.hitMissText?.setText(`Hits: ${this.hitCount}, Misses: ${this.missCount}`);

        if (time - this.lastFishTime > 1000) {
            this.lastFishTime = time;
            const direction = Math.random() > 0.5 ? 'right' : 'left';
            const camBox = getCameraBox(this);
            const fishX = direction === 'right'
                ? Phaser.Math.Between(camBox.left, camBox.left + camBox.width * 0.25)
                : Phaser.Math.Between(camBox.right - camBox.width * 0.25, camBox.right);
            const fishY = getScreenBasedPixels(this, 0.45, 'height')
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