export const ASSETS = {
    walk: new Image(),
    idle: new Image(),
    throw: new Image(),
    walkAttack: new Image(),
    bg: new Image()
};

export let bgPattern = null;

export function loadAssets(ctx) {
    ASSETS.walk.src = 'assets/images/walk.png';
    ASSETS.idle.src = 'assets/images/idle.png';
    ASSETS.throw.src = 'assets/images/throw.png';
    ASSETS.walkAttack.src = 'assets/images/walk_attack.png';
    ASSETS.bg.src = 'assets/images/background.png';

    ASSETS.bg.onload = () => {
        bgPattern = ctx.createPattern(ASSETS.bg, 'repeat');
    };
}
