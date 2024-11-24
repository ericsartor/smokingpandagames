import { Phaser } from '../barrel';

export type ExtendedSprite = {
    x: number;
    y: number;
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
};