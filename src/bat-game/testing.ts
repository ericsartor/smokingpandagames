import { Phaser } from './barrel';
import { controlBat, createBat, loadBat } from './entities/bat';
import { createSheep, loadSheep } from './entities/sheep';
import { getCameraBox, getScreenBasedPixels, getScreenBasedSpeed, getSpriteBox, iterateGroupChildren, scaleBasedOnCamera, setScreenBasedGravity } from './utils';

const PLAYER_SCALE = 0.15;
const PLAYER_SPEED = 0.3;

const SHEEP_SCALE = 0.1;
const SHEEP_SPEED_RANGE_MIN = 0.2;
const SHEEP_SPEED_RANGE_MAX = 0.7;
const SHEEP_SPAWN_RATE = 700;

type Sprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type Tile = Phaser.GameObjects.TileSprite;

export class Testing extends Phaser.Scene {

    player: Sprite | null = null;
    sheeps: Phaser.GameObjects.Group | null = null;
    sheepCount: Phaser.GameObjects.Text | null = null;
    platforms: Phaser.GameObjects.Group | null = null;
    
    hitCount: number = 0;
    missCount: number = 0;
    hitMissText: Phaser.GameObjects.Text | null = null;
    hitSheepBuffer = new Set<Sprite>();
    
    waters: Phaser.GameObjects.Group | null = null;
    waterDirections: ('left' | 'right')[] = [];
    waterMaxSpeed = 0.05;
    waterMaxDistance = 0.01;

    preload() {
        this.load.baseURL = '/bat-game';
        this.load.image('test-platform', '/test-assets/platform.png');
        this.load.image('water', '/water.png');
        loadSheep(this);
        loadBat(this);
    }

    create() {

        // Initialize gravity
        setScreenBasedGravity(this, 0, 1);

        // Create bat player
        this.player = createBat(this);
        this.player.x = 0;
        this.player.y = 0;
        scaleBasedOnCamera(this, this.player, PLAYER_SCALE);

        // Set up camera
        this.cameras.main.centerOn(0, 0);

        // Create sheep group
        this.sheeps = this.add.group();

        // Debug text
        this.sheepCount = this.add.text(0, 0, 'Sheeps: 0');
        this.sheepCount.setFontSize('96px');
        this.sheepCount.setColor('#000000');

        // Create water
        this.waters = this.add.group([
            this.physics.add.image(
                0,
                getScreenBasedPixels(this, 0.5, 'height'),
                'water',
            ),
            this.physics.add.image(
                0,
                getScreenBasedPixels(this, 0.5, 'height') + (getScreenBasedPixels(this, 0.02, 'height')),
                'water',
            ),
            this.physics.add.image(
                0,
                getScreenBasedPixels(this, 0.5, 'height') + (getScreenBasedPixels(this, 0.04, 'height')),
                'water',
            ),
        ]);
        iterateGroupChildren<Sprite>(this.waters, (water, index, arr) => {
            water.setOrigin(0.5, 1);
            water.setImmovable(true);
            water.body.setAllowGravity(false);  
            scaleBasedOnCamera(this, water, 0.5);
            if (index === arr.length - 1) {
                water.setDepth(1);
            }
            const direction = index % 2 === 0 ? 'left' : 'right';
            this.waterDirections.push(direction);
            if (direction === 'left') {
                water.setVelocityX(-getScreenBasedSpeed(this, this.waterMaxSpeed));
            } else if (direction === 'right') {
                water.setVelocityX(getScreenBasedSpeed(this, this.waterMaxSpeed));
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
        this.physics.add.collider(this.sheeps, this.player, (sheep) => {
            const sprite = sheep as Sprite;
            if (this.hitSheepBuffer.has(sprite)) return;
            this.hitCount++;
            this.hitSheepBuffer.add(sprite);
        });

        // Hit/Miss counter text
        this.hitMissText = this.add.text(camBox.x, camBox.top, `Hits: 0, Misses: 0`);
        this.hitMissText.setOrigin(0.5, 0);
        this.hitMissText.setColor('#000000');

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

    update(time: number, deltaMs: number) {
        const deltaSeconds = deltaMs / 1000;

        if (this.player) {
            controlBat(this, this.player, getScreenBasedSpeed(this, PLAYER_SPEED));
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
            const speedChange = deltaSeconds * getScreenBasedSpeed(this, 0.03);
            iterateGroupChildren<Sprite>(this.waters, (water, index) => {
                const direction = this.waterDirections[index];
                if (direction === 'left') {
                    const directionMultipler = -1;
                    const thisSpeedChange = speedChange * directionMultipler;
                    const thisMaxDistance = getScreenBasedPixels(this, this.waterMaxDistance * directionMultipler, 'width');
                    if (water.x < thisMaxDistance) {
                        this.waterDirections[index] = 'right';
                    } else {
                        water.body.velocity.x = Math.max(
                            maxSpeed * directionMultipler,
                            water.body.velocity.x + thisSpeedChange,
                        );
                    }
                } else if (direction === 'right') {
                    const directionMultipler = 1;
                    const thisSpeedChange = speedChange * directionMultipler;
                    const thisMaxDistance = getScreenBasedPixels(this, this.waterMaxDistance * directionMultipler, 'width');
                    if (water.x > thisMaxDistance) {
                        this.waterDirections[index] = 'left';
                    } else {
                        water.body.velocity.x = Math.min(
                            maxSpeed * directionMultipler,
                            water.body.velocity.x + thisSpeedChange,
                        );
                    }
                }
            });
        }

        // Update Hit/Miss counter
        this.hitMissText?.setText(`Hits: ${this.hitCount}, Misses: ${this.missCount}`);
    }

}