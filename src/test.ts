import * as Phaser from 'phaser';

let hasLetGoOfJump = true;
class Example extends Phaser.Scene {

    platforms: Phaser.Physics.Arcade.StaticGroup | null = null;
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null = null;
    arrows: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
    text: Phaser.GameObjects.Text | null = null;

    preload () {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 
            'assets/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );
    }

    create () {
        this.add.image(400, 300, 'sky');
        this.text = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000000' });

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');
        
        this.player = this.physics.add.sprite(100, 450, 'dude')
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
        this.arrows = this.input.keyboard?.createCursorKeys() ?? null;
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });


        // Bombs
        const bombs = this.physics.add.group({
            key: 'bomb',
        });
        this.physics.add.collider(this.platforms, bombs);
        this.physics.add.collider(this.player, bombs, () => {
            this.player?.destroy();
        });

        // Stars
        const stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 },
        });
        stars.children.iterate((child) => {

            return true;
        });
        this.physics.add.collider(stars, this.platforms);
        const addPoint = () => {
            const score = Number(this.player?.getData('score') ?? 0);
            this.player?.setData('score', score + 1);
            this.text?.setText(`score: ${score + 1}`);
        };
        this.physics.add.overlap(this.player, stars, (_, star) => {
            star.destroy();
            addPoint();
            const bomb = bombs.create(400, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        });

    }

    update() {

        if (this.arrows) {

            if (this.arrows.left.isDown) {
                this.player?.body.setVelocityX(-150);
                if (this.player?.body.touching.down) {
                    this.player?.anims.play('left', true);
                    this.player.anims.currentAnim?.resume();
                } else {
                    if (this.player?.anims.currentAnim?.key === 'left') {
                        this.player?.anims.currentAnim.pause();
                    }
                }
            } else if (this.arrows.right.isDown) {
                this.player?.body.setVelocityX(150);
                if (this.player?.body.touching.down) {
                    this.player?.anims.play('right', true);
                    this.player.anims.currentAnim?.resume();
                } else {
                    if (this.player?.anims.currentAnim?.key === 'right') {
                        this.player?.anims.currentAnim.pause();
                    }
                }
            } else {
                this.player?.body.setVelocityX(0);
                this.player?.anims.play('turn', true);
            }

            if (hasLetGoOfJump && this.arrows.up.isDown && this.player?.body.touching.down) {
                this.player.body.setVelocityY(-330);
                hasLetGoOfJump = false;
            }
            if (this.arrows.up.isUp && !hasLetGoOfJump) {
                hasLetGoOfJump = true;
            }

        }

    }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: Example,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300,
                x: 0,
            }
        }
    }
};

export const startGame = () => {
    new Phaser.Game(config);
};