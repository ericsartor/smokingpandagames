import * as Phaser from 'phaser';

class PracticeScene extends Phaser.Scene {

    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
    playerHealth: number = 5;
    playerHealthText: Phaser.GameObjects.Text | null = null;
    bullets: Phaser.Physics.Arcade.Group | null = null;
    lastBullet = 0;
    controls: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    lastBomb: number = 0;
    destroyedBombCount = 0;
    destroyedBombCountText: Phaser.GameObjects.Text | null = null;
    bombs: Phaser.Physics.Arcade.Group | null = null;
    gameOver = false;

    preload() {

        this.load.image('sky', '/assets/sky.png');
        this.load.image('bomb', '/assets/bomb.png');
        this.load.image('bullet', '/assets/star.png');
        this.load.spritesheet('player', '/assets/dude.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

    }

    create() {

        if (!this.input.keyboard) throw Error('keyboard missing');

        this.controls = this.input.keyboard.createCursorKeys();

        const screenWidth = Number(this.game.config.width);
        const screenHeight = Number(this.game.config.height);

        // Bounds
        const bounds = this.physics.add.staticGroup();
        const bottom = this.physics.add.staticImage(screenWidth / 2, screenHeight + 5, '');
        bottom.setSize(screenWidth, 10);
        bottom.setBounce(1);
        bounds.add(bottom);
        const top = this.physics.add.staticImage(screenWidth / 2, -5, '');
        top.setSize(screenWidth, 10);
        bounds.add(top);
        const left = this.physics.add.staticImage(-5, screenHeight / 2, '');
        left.setSize(10, screenHeight);
        left.setBounce(1);
        bounds.add(left);
        const right = this.physics.add.staticImage(screenWidth + 5, screenHeight / 2, '');
        right.setSize(10, screenHeight);
        right.setBounce(1);
        bounds.add(right);

        // Background sky
        this.add.image(screenWidth / 2, screenHeight / 2, 'sky');

        this.player = this.physics.add.sprite(screenWidth / 2, screenHeight - 24, 'player', 4);
        this.physics.add.collider(this.player, bounds);
        this.anims.create({
            key: 'player-left',
            frameRate: 10,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        });
        this.anims.create({
            key: 'player-right',
            frameRate: 10,
            repeat: -1,
            frames: this.anims.generateFrameNumbers('player', { start: 5, end: 8 }),
        });

        // Bombs
        this.bombs = this.physics.add.group({
            bounceX: 1,
            bounceY: 1,
        });
        this.physics.add.collider(this.bombs, bounds);
        this.physics.add.collider(this.player, this.bombs, (_, bomb) => {
            this.playerHealth--;
            bomb.destroy();
            this.playerHealthText?.setText(`Health: ${this.playerHealth}`);
            if (this.playerHealth === 0) {
                this.physics.pause();
                this.gameOver = true;
                if (this.player) {
                    this.player.setTint(123);
                }
            }
        });

        // Bullets
        this.bullets = this.physics.add.group({
            gravityY: 0,
            allowGravity: false,
        });
        this.physics.add.collider(this.bullets, top, (bullet) => {
            console.log(this.bullets?.children.size);
            bullet.destroy();
            console.log('hit top');
            console.log(this.bullets?.children.size);
            bullet.destroy();
            console.log(this.bullets?.children.size);
        });
        this.physics.add.collider(this.bullets, this.bombs, (bullet, bomb) => {
            bullet.destroy();
            bomb.destroy();
            this.destroyedBombCount++;
            this.destroyedBombCountText?.setText(`Destroyed Bombs: ${this.destroyedBombCount}`);
        });

        this.playerHealthText = this.add.text(0, 0, `Health: ${this.playerHealth}`);
        this.destroyedBombCountText = this.add.text(200, 0, `Destroyed Bombs: ${this.destroyedBombCount}`);

    }

    update(time: number, delta: number): void {

        if (this.controls === null) return;
        if (this.player === null) return;
        if (this.bullets === null) return;
        if (this.bombs === null) return;
        if (this.playerHealthText === null) return;
        if (this.gameOver) return;

        const screenWidth = Number(this.game.config.width);
        const screenHeight = Number(this.game.config.height);

        if (this.controls.left.isDown) {
            this.player.anims.play('player-left', true);
            this.player.setVelocityX(-200);
        } else if (this.controls.right.isDown) {
            this.player.anims.play('player-right', true);
            this.player.setVelocityX(200);
        } else {
            this.player.anims.stop();
            this.player.setVelocityX(0);
        }
        
        if (time - this.lastBullet > 500 && (this.controls.up.isDown || this.controls.space.isDown)) {
            this.lastBullet = time;
            const newBullet = this.bullets.create(this.player.x, this.player.y - 12 - 24, 'bullet');
            newBullet.setVelocityY(-700);
        }
        
        if (this.lastBomb === 0) {
            this.lastBomb = time;
        } else if (time - this.lastBomb > 3000) {
            this.lastBomb = time;
            const newBomb = this.physics.add.image(
                Phaser.Math.Between(0, screenWidth),
                Phaser.Math.Between(0, screenHeight / 2),
                'bomb',
            );
            const bombVelocityX = Phaser.Math.Between(-500, 500);
            const bombVelocityY = Phaser.Math.Between(-400, -100);
            this.bombs.add(newBomb);
            newBomb.body.setVelocityX(bombVelocityX);
        }

    }

}

export const startGame = () => {
    new Phaser.Game({
        width: 800,
        height: 600,
        type: Phaser.AUTO,
        scene: PracticeScene,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {
                    y: 300,
                    x: 0,
                }
            }
        }
    })
};