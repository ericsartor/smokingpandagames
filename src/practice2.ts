import * as Phaser from 'phaser';

class PracticeScene2 extends Phaser.Scene {

    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;

    preload() {
        this.load.image('platform', '/assets/platform.png');
        this.load.spritesheet('pinkman', '/assets/bridget-spritesheet.png', {
            frameWidth: 794,
            frameHeight: 550,
        });
    }

    create() {
        this.player = this.physics.add.sprite(0, 0, 'pinkman', 0);
        this.anims.create({
            key: 'pinkman-left',
            frameRate: 5,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('pinkman', { start: 0, end: 3 }),
        });
        this.anims.create({
            key: 'pinkman-right',
            frameRate: 5,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('pinkman', { start: 0, end: 3 }),
        });
        this.cameras.main.centerOn(this.player.x, this.player.y);
    }

    update() {
        if (this.player === null) return;
        this.player.anims.play('pinkman-left', true);
        this.cameras.main.setZoom(0.2, 0.2);
        this.player.setVelocityX(600);

        const controls = this.input.keyboard!.createCursorKeys();
        const speed = 1000;
        if (controls.left.isDown) {
            this.player.setFlipX(true);
            this.player.anims.play('pinkman-left', true);
            this.player.setVelocityX(-speed);
        } else if (controls.right.isDown) {
            this.player.setFlipX(false);
            this.player.anims.play('pinkman-left', true);
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }
        if (controls.up.isDown) {
            this.player.setVelocityY(-speed);
        } else if (controls.down.isDown) {
            this.player.setVelocityY(speed);
        } else {
            this.player.setVelocityY(0);
        }
    }

}



export const startGame = () => {
    new Phaser.Game({
        width: 800,
        height: 600,
        type: Phaser.AUTO,
        scene: PracticeScene2,
        backgroundColor: '#ffffff',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 0,
                    x: 0,
                }
            }
        }
    })
};