// PORTAL KOMBAT - Комбо система
let comboSequence = [];
let comboTimeout;
let activeCombo = null;

const COMBOS = {
    'QWE': {
        name: 'ПОРТАЛЬНЫЙ УДАР',
        damage: 50,
        effect: 'portal_strike',
        color: '#aa00ff'
    },
    'WER': {
        name: 'ЦЕПНАЯ МОЛНИЯ',
        damage: 35,
        effect: 'chain_lightning',
        color: '#00ffff'
    },
    'QER': {
        name: 'ГРАВИТОННЫЙ ВЗРЫВ',
        damage: 70,
        effect: 'gravity_explosion',
        color: '#ffff00'
    },
    'QQQ': {
        name: 'ТРОЙНОЙ УДАР',
        damage: 30,
        effect: 'triple_hit',
        color: '#ff5555'
    },
    'SPACESPACESPACE': {
        name: 'ПОРТАЛЬНЫЙ ШТОРМ',
        damage: 100,
        effect: 'portal_storm',
        color: '#ff00ff'
    }
};

// Обработка комбо
function triggerCombo(key, scene) {
    // Подсветка клавиши
    let keyElement = document.getElementById('key-' + key.toLowerCase());
    if (keyElement) {
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), 200);
    }
    
    // Добавление в последовательность
    comboSequence.push(key);
    
    // Сброс таймера
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
        comboSequence = [];
    }, 1500);
    
    // Проверка комбо
    let comboString = comboSequence.join('');
    
    for (let combo in COMBOS) {
        if (comboString.includes(combo)) {
            activateCombo(combo, scene);
            comboSequence = [];
            break;
        }
    }
    
    // Ограничение длины последовательности
    if (comboSequence.length > 10) {
        comboSequence = [];
    }
}

// Активация комбо
function activateCombo(comboKey, scene) {
    let combo = COMBOS[comboKey];
    if (!combo) return;
    
    activeCombo = combo;
    
    // Визуальный эффект
    showComboText(combo.name, combo.color);
    
    // Игровой эффект
    switch(combo.effect) {
        case 'portal_strike':
            createPortalStrike(scene);
            break;
        case 'chain_lightning':
            createChainLightning(scene);
            break;
        case 'gravity_explosion':
            createGravityExplosion(scene);
            break;
        case 'triple_hit':
            createTripleHit(scene);
            break;
        case 'portal_storm':
            createPortalStorm(scene);
            break;
    }
    
    // Сброс комбо через 3 секунды
    setTimeout(() => {
        activeCombo = null;
    }, 3000);
}

// Эффекты комбо
function createPortalStrike(scene) {
    // Создание портала-ловушки
    for (let i = 0; i < 3; i++) {
        let portal = scene.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(100, 500),
            'portal'
        );
        portal.setTint(0xaa00ff);
        
        scene.time.delayedCall(2000, () => {
            if (portal.active) {
                // Взрыв портала
                let explosion = scene.add.sprite(portal.x, portal.y, 'explosion');
                explosion.play('explode');
                explosion.on('animationcomplete', () => explosion.destroy());
                portal.destroy();
            }
        });
    }
}

function createChainLightning(scene) {
    // Цепная молния между врагами
    for (let i = 0; i < enemies.length - 1; i++) {
        if (enemies[i] && enemies[i + 1]) {
            let graphics = scene.add.graphics();
            graphics.lineStyle(3, 0x00ffff, 1);
            graphics.lineBetween(
                enemies[i].x, enemies[i].y,
                enemies[i + 1].x, enemies[i + 1].y
            );
            
            scene.time.delayedCall(300, () => graphics.destroy());
        }
    }
}

function createGravityExplosion(scene) {
    // Взрыв, притягивающий врагов
    let explosion = scene.physics.add.sprite(player.x, player.y, 'explosion');
    explosion.play('explode');
    explosion.setScale(3);
    
    enemies.forEach(enemy => {
        let angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        let force = 200;
        enemy.setVelocity(
            Math.cos(angle) * force,
            Math.sin(angle) * force
        );
    });
    
    scene.time.delayedCall(1000, () => explosion.destroy());
}

function createTripleHit(scene) {
    // Три быстрых пули
    for (let i = 0; i < 3; i++) {
        scene.time.delayedCall(i * 100, () => {
            createBullet(scene);
        });
    }
}

function createPortalStorm(scene) {
    // Множество порталов
    for (let i = 0; i < 8; i++) {
        scene.time.delayedCall(i * 100, () => {
            let portal = scene.physics.add.sprite(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(50, 550),
                'portal'
            );
            portal.setTint(0xff00ff);
            
            scene.time.delayedCall(1000, () => {
                if (portal.active) portal.destroy();
            });
        });
    }
}

// Текст комбо
function showComboText(text, color) {
    let hud = document.getElementById('hud');
    let comboText = document.createElement('div');
    comboText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 48px;
        color: ${color};
        text-shadow: 0 0 20px ${color};
        font-weight: bold;
        z-index: 1000;
        animation: comboPop 1s forwards;
    `;
    
    comboText.textContent = text;
    document.body.appendChild(comboText);
    
    // Анимация
    setTimeout(() => {
        comboText.remove();
    }, 1000);
}

// Добавить в CSS анимацию
let style = document.createElement('style');
style.textContent = `
    @keyframes comboPop {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
`;
document.head.appendChild(style);
