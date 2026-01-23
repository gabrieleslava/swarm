export const ASSETS = {
    walk: new Image(),
    idle: new Image(),
    throw: new Image(),
    walkAttack: new Image(),
    bg: new Image(),
    monster_slime: new Image(),
    monster_eye: new Image(),
    monster_skeleton: new Image(),
    boss_demon: new Image()
};

export let bgPattern = null;

export function loadAssets(ctx) {
    ASSETS.walk.src = 'assets/images/walk.png';
    ASSETS.idle.src = 'assets/images/idle.png';
    ASSETS.throw.src = 'assets/images/throw.png';
    ASSETS.walkAttack.src = 'assets/images/walk_attack.png';
    ASSETS.bg.src = 'assets/images/background.png';

    // Monitors
    ASSETS.monster_slime.src = 'assets/images/monster_slime.png';
    ASSETS.monster_eye.src = 'assets/images/monster_eye.png';
    ASSETS.monster_skeleton.src = 'assets/images/monster_skeleton.png';
    ASSETS.boss_demon.src = 'assets/images/boss_demon.png';


    ASSETS.bg.onload = () => {
        bgPattern = ctx.createPattern(ASSETS.bg, 'repeat');
    };
}
