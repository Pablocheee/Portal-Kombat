// Простой WebSocket сервер для мультиплеера
// Разместите на glitch.com или heroku

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let players = {};

wss.on('connection', (ws) => {
    let playerId = Math.random().toString(36).substr(2, 9);
    
    players[playerId] = {
        id: playerId,
        x: Math.random() * 800,
        y: Math.random() * 600,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };
    
    // Отправляем новому игроку всех остальных
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        players: players
    }));
    
    // Оповещаем всех о новом игроке
    broadcast({
        type: 'playerJoined',
        player: players[playerId]
    }, ws);
    
    // Обработка сообщений
    ws.on('message', (message) => {
        let data = JSON.parse(message);
        
        switch(data.type) {
            case 'move':
                players[playerId].x = data.x;
                players[playerId].y = data.y;
                broadcast({
                    type: 'playerMoved',
                    playerId: playerId,
                    x: data.x,
                    y: data.y
                }, ws);
                break;
                
            case 'attack':
                broadcast({
                    type: 'playerAttack',
                    playerId: playerId,
                    combo: data.combo
                }, ws);
                break;
        }
    });
    
    // Отключение
    ws.on('close', () => {
        delete players[playerId];
        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
    });
});

function broadcast(data, exclude = null) {
    wss.clients.forEach(client => {
        if (client !== exclude && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

console.log('Portal Kombat сервер запущен на порту 8080');
