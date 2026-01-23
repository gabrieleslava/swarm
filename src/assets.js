export const ASSETS = {
    walk: new Image(),
    idle: new Image(),
    throw: new Image(),
    walkAttack: new Image(),
    bg: new Image(),
    monster_slime: new Image(),
    monster_eye: new Image(),
    monster_skeleton: new Image(),
    boss_demon: new Image(),
    monster_red: new Image()
};

export let bgPattern = null;

export function loadAssets(ctx) {
    ASSETS.walk.src = 'assets/images/walk.png';
    ASSETS.idle.src = 'assets/images/idle.png';
    ASSETS.throw.src = 'assets/images/throw.png';
    ASSETS.walkAttack.src = 'assets/images/walk_attack.png';
    ASSETS.bg.src = 'assets/images/background.png';

    // Monitors
    // Use color keying to remove magenta background
    loadWithColorKey(ASSETS.monster_slime, 'assets/images/monster_slime.png');
    loadWithColorKey(ASSETS.monster_eye, 'assets/images/monster_eye.png');
    loadWithColorKey(ASSETS.monster_skeleton, 'assets/images/monster_skeleton.png');

    // User custom sprite (stitched)
    ASSETS.monster_red.src = 'assets/images/monster_red.png';

    ASSETS.boss_demon.src = 'assets/images/boss_demon.png';


    ASSETS.bg.onload = () => {
        bgPattern = ctx.createPattern(ASSETS.bg, 'repeat');
    };
}

function loadWithColorKey(imgObj, src) {
    const tempImg = new Image();
    tempImg.src = src;
    tempImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempImg, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Remove Magenta (#FF00FF)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Tolerance around 255, 0, 255
            if (r > 240 && g < 20 && b > 240) {
                data[i + 3] = 0; // Alpha 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        imgObj.src = canvas.toDataURL();
    };
}
