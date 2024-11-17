export const sheepFrameWidth = 504;
export const sheepFrameHeight = 556;

export function loadSheep(scene: Phaser.Scene) {
    scene.load.spritesheet('sprite-sheep-left', '/sheep/sprite_sheet.png', {
        frameWidth: sheepFrameWidth,
        frameHeight: sheepFrameHeight,
    });
}

let createdAnim = false;
export const createSheep = (scene: Phaser.Scene) => {

    // Create physics sprite
    const sheep = scene.physics.add.sprite(0, 0, 'sprite-sheep-left', 0);

    // Adjust hitbox
    sheep.body.setCircle(sheep.width * 0.38, sheep.width * 0.12, sheep.height * 0.2);

    // Set bounce
    sheep.setBounce(1);

    // Set up flying animation
    if (!createdAnim) {
        scene.anims.create({
            key: 'anim-sheep-left',
            frameRate: 15,
            repeat: -1,
            frames: scene.anims.generateFrameNumbers('sprite-sheep-left', { start: 0, end: 15 }),
        });
        createdAnim = true;
    }
    sheep.anims.play('anim-sheep-left');

    return sheep;
};