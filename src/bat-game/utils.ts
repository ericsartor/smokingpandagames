import { Phaser } from "./barrel";

export const getCameraBox = (scene: Phaser.Scene) => {
    const { x, y, width, height, zoomX, zoomY } = scene.cameras.main;
    const scaledWidth = (width * (1 / zoomX));
    const scaledHeight = (height * (1 / zoomY));
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;
    return {
        left: x - halfWidth,
        right: x + halfWidth,
        top: y - halfHeight,
        bottom: y + halfHeight,
        width: scaledWidth,
        height: scaledHeight,
        x,
        y,
    };
};

export const getSpriteBox = (sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
    const { x, y, width, height, scaleX, scaleY } = sprite;
    const scaledWidth = (width * scaleX);
    const scaledHeight = (height * scaleY);
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;
    return {
        left: x - halfWidth,
        right: x + halfWidth,
        top: y - halfHeight,
        bottom: y + halfHeight,
        width: scaledWidth,
        height: scaledHeight,
        x,
        y,
    };
};

interface CanBeScaled {
    setScale(x?: number, y?: number): any;
    width: number;
}
type ScaleResult = {
    pixels: number;
    scale: number;
};
export const scaleBasedOnCamera = (
    cameraOrScene: Phaser.Cameras.Scene2D.Camera | Phaser.Scene,
    sprite: CanBeScaled,
    desiredWidthScale: number,
): ScaleResult => {
    const camera = cameraOrScene instanceof Phaser.Scene ? cameraOrScene.cameras.main : cameraOrScene;
    const desiredPixelWidth = camera.width * desiredWidthScale;
    const pixelDiff = desiredPixelWidth / sprite.width;
    sprite.setScale(pixelDiff);
    return {
        scale: pixelDiff,
        pixels: pixelDiff * sprite.width,
    }
};

interface CanBeTileScaled {
    setTileScale(x?: number, y?: number): any;
    width: number;
}
type TileScaleResult = {
    pixels: number;
    scale: number;
};
export const scaleTileBasedOnCamera = (
    cameraOrScene: Phaser.Cameras.Scene2D.Camera | Phaser.Scene,
    sprite: CanBeTileScaled,
    desiredWidthScale: number,
): TileScaleResult => {
    const camera = cameraOrScene instanceof Phaser.Scene ? cameraOrScene.cameras.main : cameraOrScene;
    const desiredPixelWidth = camera.width * desiredWidthScale;
    const pixelDiff = desiredPixelWidth / sprite.width;
    sprite.setTileScale(pixelDiff);
    return {
        scale: pixelDiff,
        pixels: pixelDiff * sprite.width,
    }
};

const speedCache: { [speed: number]: number } = {};
export const getScreenBasedSpeed = (scene: Phaser.Scene, speed: number) => {
    if (speedCache[speed] !== undefined) return speedCache[speed];
    const result = scene.game.canvas.width * speed;
    speedCache[speed] = result;
    return result;
};

export const setScreenBasedGravity = (scene: Phaser.Scene, gravityX: number, gravityY: number) => {
    scene.physics.world.gravity.set(gravityX * scene.game.canvas.width, gravityY * scene.game.canvas.width);
};

export const getScreenBasedPixels = (scene: Phaser.Scene, size: number, dimension: 'width' | 'height'): number => {
    const dimensionPixels = dimension === 'width' ? scene.game.canvas.width : scene.game.canvas.height;
    return size * dimensionPixels;
};

export const iterateGroupChildren = <T>(
    group: Phaser.GameObjects.Group,
    callback: (child: T, index: number, arr: T[]) => void,
) => {
    group.getChildren().forEach((child, index, arr) => {
        const sprite = child as T;
        callback(sprite, index, arr as T[]);
    });
};