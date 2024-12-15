import { registerCreateFunc, registerLoadFunc } from "../loading";
import { scaleBasedOnCamera } from "../utils";

export const sheepFrameWidth = 504;
export const sheepFrameHeight = 556;


registerLoadFunc((scene: Phaser.Scene) => {
    scene.load.spritesheet('sprite-sheep-left', '/sheep/sprite_sheet.png', {
        frameWidth: sheepFrameWidth,
        frameHeight: sheepFrameHeight,
    });
});

registerCreateFunc((scene: Phaser.Scene) => {
    scene.anims.create({
        key: 'anim-sheep-left',
        frameRate: 15,
        repeat: -1,
        frames: scene.anims.generateFrameNumbers('sprite-sheep-left', { start: 0, end: 15 }),
    });
});

type SheepOptions = {
    direction: 'left' | 'right';
    speed: number;
    size: number;
};
export class Sheep {

    scene: Phaser.Scene;
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    direction: 'left' | 'right';

    constructor(scene: Phaser.Scene, x: number, y: number, options: SheepOptions) {
        // Store scene
        this.scene = scene;

        // Store options
        this.direction = options.direction;

        // Register updates
        scene.events.on('update', this.update, this);
        scene.events.on('shutdown', () => {
            scene.events.off('update', this.update);
        });

        // Set sprite up
        this.sprite = scene.physics.add.sprite(0, 0, 'sprite-sheep-left', 0);
        this.sprite.x = x;
        this.sprite.y = y;
        scaleBasedOnCamera(this.scene, this.sprite, options.size);

        // Adjust hitbox
        this.sprite.body.setCircle(this.sprite.width * 0.38, this.sprite.width * 0.12, this.sprite.height * 0.2);
    
        // Set bounce
        this.sprite.setBounce(0.8);
        this.sprite.setFriction(0);

        // Start animation
        this.sprite.anims.play('anim-sheep-left');
        if (this.direction === 'right') {
            this.sprite.setFlipX(true);
        }

        // Set velocity
        this.sprite.setVelocityX(options.speed * (this.direction === 'left' ? -1 : 1));
    }

    update() {

    }
}