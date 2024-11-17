import { Phaser } from "../barrel";

export const batFrameWidth = 794;
export const batFrameHeight = 550;

export const loadBat = (scene: Phaser.Scene) => {
    // Load spritesheet for flying
    scene.load.spritesheet('sprite-bat-right', '/bat/sprite_sheet.png', {
        frameWidth: 794,
        frameHeight: 550,
    });
};

export const createBat = (scene: Phaser.Scene) => {
    // Set up flying animation
    scene.anims.create({
        key: 'anim-bat-right',
        frameRate: 5,
        repeat: -1,
        frames: scene.anims.generateFrameNumbers('sprite-bat-right', { start: 0, end: 3 }),
    });

    // Create physics sprite
    const bat = scene.physics.add.sprite(0, 0, 'sprite-bat-right', 0);

    // Remove gravity
    bat.body.setAllowGravity(false);

    bat.setBounce(1);

    // Adjust hitbox
    bat.body.setCircle(bat.width * 0.3, bat.width * 0.2, bat.height * 0.06);

    return bat;
};

export const controlBat = (
    scene: Phaser.Scene,
    bat: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    speed: number,
) => {
    // Handle input
    if (scene.input.keyboard) {
        const controls = scene.input.keyboard.createCursorKeys();
        const boost = scene.input.keyboard.addKey('SPACE');

        speed = speed * (boost.isDown ? 2 : 1);

        // Horizontal movement
        if (controls.left.isDown) {
            bat.setFlipX(true);
            bat.anims.play('anim-bat-right', true);
            bat.setVelocityX(-speed);
        } else if (controls.right.isDown) {
            bat.setFlipX(false);
            bat.anims.play('anim-bat-right', true);
            bat.setVelocityX(speed);
        } else {
            if (!bat.anims.currentAnim) {
                bat.anims.play('anim-bat-right', true);
            }
            bat.setVelocityX(0);
        }

        // Vertical movement
        if (controls.up.isDown) {
            bat.setVelocityY(-speed);
        } else if (controls.down.isDown) {
            bat.setVelocityY(speed);
        } else {
            bat.setVelocityY(0);
        }
    }
};