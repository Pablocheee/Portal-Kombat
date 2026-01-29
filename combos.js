// ДОПОЛНИТЕЛЬНАЯ СИСТЕМА КОМБО ДЛЯ PORTAL KOMBAT

// Расширенные комбинации
const ADVANCED_COMBOS = {
    'QWE': {
        name: '🌀 ПОРТАЛЬНЫЙ ШТОРМ',
        effect: function(scene, player) {
            // Создает несколько порталов
            for (let i = 0; i < 5; i++) {
                scene.time.delayedCall(i * 200, () => {
                    const portal = scene.physics.add.sprite(
                        player.x + Phaser.Math.Between(-200, 200),
                        player.y + Phaser.Math.Between(-150, 150),
                        'portal'
                    );
                    portal.setTint(0xff00ff);
                    
                    // Автоуничтожение
                    scene.time.delayedCall(3000, () => portal.destroy());
                });
            }
        }
    },
    'SPACE SPACE SPACE': {
        name: '⭐ ЗВЕЗДНЫЙ УДАР',
        effect: function(scene, player) {
            // Круговая атака звездами
            for (let i = 0; i < 12; i++) {
                const angle = (i * 30) * Math.PI / 180;
                const star = scene.physics.add.sprite(
                    player.x,
                    player.y,
                    'star'
                );
                star.setTint(0xffff00);
                
                const speed = 200;
                star.setVelocity(
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed
                );
                
                scene.time.delayedCall(2000, () => star.destroy());
            }
        }
    }
};

// Мобильное управление комбо
function setupMobileComboButtons() {
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
        const buttons = `
            <div id="combo-buttons" style="position: fixed; bottom: 100px; right: 20px; display: flex; flex-direction: column;">
                <button class="combo-btn" data-key="Q" style="margin: 5px; padding: 10px; background: #333; color: white; border: 2px solid #0ff;">Q</button>
                <button class="combo-btn" data-key="W" style="margin: 5px; padding: 10px; background: #333; color: white; border: 2px solid #0ff;">W</button>
                <button class="combo-btn" data-key="E" style="margin: 5px; padding: 10px; background: #333; color: white; border: 2px solid #0ff;">E</button>
                <button class="combo-btn" data-key="R" style="margin: 5px; padding: 10px; background: #333; color: white; border: 2px solid #0ff;">R</button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', buttons);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', setupMobileComboButtons);
