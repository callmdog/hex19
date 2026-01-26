const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require('path');
const axios = require('axios');
const fs = require('fs');
app.use(express.json());
app.use(express.static('public'));

//////////////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////   
///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////  
//////////////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////   
///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////  

//VARIABLES!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
///////////////////////////////////////////////////////
const hexagonMap = [
[ { direction: 'NE' },  { direction: 'E' }, { direction: 'SE' }, { direction: 'E' }, { direction: 'SE' }, { direction: 'E' }, { direction: 'SE' }, { direction: 'E' } ],
[ { direction: 'NW' },  { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' } ],
[ { direction: 'NW' },   { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' } ],
[ { direction: 'SW' },   { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' } ],
[ { direction: 'SW' },   { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' } ],
[ { direction: 'SW' },   { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' }, { direction: 'ES' }, { direction: 'E' } ],
    // Repite el patrón de filas según sea necesario para tener 20 filas en total
];
const connectedUsers = new Set();
const availableColors = ['blue', 'purple', 'orange', 'pink', 'yellow', 'cyan', 'teal', 'maroon', 'lime', 'brown', 'indigo', 'gray', 'gold', 'silver', 'olive', 'navy', 'magenta', 'peach', 'violet', 'turquoise', 'lavender', 'salmon', 'beige'];
const assignedColors = new Map(); // Mapa para almacenar el color asignado a cada jugador
let colorIndex = 0; //// Índice para asignar colores a usuarios
let players = {};
const greenCircles = [];
let greenCirclesS = [];
let todosVertices = [];
const randomCoords = [];
let ranX = 0;
let ranY = 0;
function getRandomPosition() {
const x = Math.floor(Math.random() * 800);
const y = Math.floor(Math.random() * 800);
return { x, y };
}

//1. CREACION MAPA LOGICO PARA VERDES!!!!!!!!!!!!!!!!!!!!!
///////////////////////////////////////////////////////
function getHexagonPoints(x, y, size) {
const points = [];
for (let i = 0; i < 6; i++) {
const angle = (2 * Math.PI / 6) * i;
const pointX = x + size * Math.cos(angle);
const pointY = y + size * Math.sin(angle);
points.push({ x: pointX, y: pointY });
}return points;}
function generateRandomLineCoordinates() {
const hexagonSize = 50;
const numRows = hexagonMap.length;
const numCols = hexagonMap[0].length;
const hexWidth = hexagonSize * Math.sqrt(3);
const hexHeight = hexagonSize * Math.sqrt(3);
const coordinates = [];
// Generar coordenadas medias entre los vértices adyacentes
for (let row = 0; row < numRows; row++) {
for (let col = 0; col < numCols; col++) {
const x = col * (hexWidth * 0.87);
const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);
const points = getHexagonPoints(x, y, hexagonSize);
for (let i = 0; i < points.length; i++) {
const nextIndex = (i + 1) % points.length;
const point1 = points[i];
const point2 = points[nextIndex];
const midX = (point1.x + point2.x) / 2;
const midY = (point1.y + point2.y) / 2;
const randomFactor = Math.random(); // Factor aleatorio entre 0 y 1
const randomX = point1.x + (point2.x - point1.x) * randomFactor;
const randomY = point1.y + (point2.y - point1.y) * randomFactor;
if (!isNaN(midX) && !isNaN(midY)) {
coordinates.push({ x: randomX, y: randomY, z: 0 });
//console.log('randomX:', randomX, randomY);  
}}}}	
const randomCoordinates = new Set(); // Usamos un conjunto para evitar duplicados
let index = 200; // Inicializamos el índice en 0
while (randomCoordinates.size < 20) {
const randomIndex = Math.floor(Math.random() * coordinates.length);
const randomCoordinate = coordinates[randomIndex];
// Verificar si randomCoordinate está definido
if (randomCoordinate) {
randomCoordinate.index = index; // Asignamos el índice a randomCoordinate
randomCoordinates.add(randomCoordinate); // Agregamos la coordenada al conjunto
// Agregar un console.log para imprimir las coordenadas aleatorias seleccionadas
// console.log(`Coordenada aleatoria ${randomCoordinate.index}: (${randomCoordinate.x}, ${randomCoordinate.y}), ${randomCoordinate.z}, ${randomCoordinate.index}`);
index++; 
} else {
console.log(`Error: No se pudo obtener la coordenada aleatoria ${randomCoordinates.size + 1}`); }
}
return Array.from(randomCoordinates); // Convertimos el conjunto a un array para mantener el formato de salida
}
greenCirclesS = generateRandomLineCoordinates();
for (let i = 0; i < greenCirclesS.length; i++) {
//console.log(`Valor Z MODIFICA: ${i}:`);
greenCirclesS[i].z = i+1;
}
//1. END CREACION MAPA LOGICO PARA VERDES!!!!!!!!!!!!!!!!!
///////////////////////////////////////////////////////

//2. GENERAR POSICION INICIAL X e Y de JUGADOR!!!!!!!!!!!!
///////////////////////////////////////////////////////
function generateAllHexagonVertices() {
const hexagonSize = 50;
const numRows = hexagonMap.length;
const numCols = hexagonMap[0].length;
const hexWidth = hexagonSize * Math.sqrt(3);
const hexHeight = hexagonSize * Math.sqrt(3);
const vertices = [];
// Generar coordenadas medias entre los vértices adyacentes
for (let row = 0; row < numRows; row++) {
for (let col = 0; col < numCols; col++) {
const x = col * (hexWidth * 0.87);
const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0);
const points = getHexagonPoints(x, y, hexagonSize);
for (let i = 0; i < points.length; i++) {
vertices.push(points[i]);
todosVertices.push(points[i]);
}}}
return vertices;
}
const allHexagonVertices = generateAllHexagonVertices();
//greenCirclesS = generateAllHexagonVertices();
//console.log(allHexagonVertices); // Opcional: Imprime los vértices en la consola para visualizarlos
console.log("Número total de puntos de vértice en el mapa hexagonal:", allHexagonVertices.length);
function printRandomValue(min, max) {
const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
return randomValue;
}  
//2. END GENERAR POSICION INICIAL X e Y de JUGADOR!!!!!!!!!!!!
///////////////////////////////////////////////////////

///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////  
/////// SE INICIA EL SERVIDOR!!!!!!!    ///////    ///////    ///////    ///////    ///////  
//START SOCKET CONNECTION ///////    ///////    ///////  ///////    ///////    ///////    ///////    ///////    ///////    
///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    

io.on('connection', (socket) => {

let randomV = printRandomValue(1,  todosVertices.length  );
let randomX = todosVertices[randomV].x;
let randomY = todosVertices[randomV].y;
console.log("RandomHex:", randomX, randomY);
console.log(`LENGTH GreenCirclesS: ${greenCirclesS.length}:`);	

//HIGHSCORE LISTA AL CLIENTE!!!!!!!!
//HIGHSCORE LISTA AL CLIENTE!!!!!!!!
//HIGHSCORE LISTA AL CLIENTE!!!!!!!!
socket.on('enviarLista', async () => {
let jsonData = [];
try {
const highscores = await getCurrentHighscores();
console.log('Enviar Lista HS');
socket.emit('obtenerLista', highscores);
console.log(`VALOR HS: ${highscores}`);
//console.log('VALOR HS2:', JSON.stringify(highscores, null, 2));
// Si deseas solo el contenido (los datos JSON), puedes hacer lo siguiente
console.log('Highscores content:', JSON.parse(highscores.content));
} catch (error) {
console.error('Error fetching highscores:', error);
}
});		

//DIBUJAR CIRCULOS VERDES	
socket.on('dibujarVerdes', (numero) => {
console.log(`DIBUJAR VERDES`);
socket.emit('greenCirclesGenerated', greenCirclesS);
});

//CONFIRMATION NOMBRE PARA INICIAR SERVER
/////////////////////////////////////////
socket.on('playerNameEntered', (playerName, skinCode) => {
	
console.log(`Nombre jugador Server: ${playerName}`);
console.log(`SkinCODE: ${skinCode}`);

//USUARIOS CONECTADOS
console.log(`Total de usuarios: ${connectedUsers.size}`);
console.log('Nuevo usuario conectado');
connectedUsers.add(socket.id);
io.emit('userCount', connectedUsers.size);
socket.emit('allPlayersInfo', players);

//OBTENER COLOR PARA JUGADOR    
const colorsArray = Array.from(availableColors);
const userColor = colorsArray[colorIndex % colorsArray.length];
colorIndex++;
assignedColors.set(socket.id, { color: userColor, name: playerName});
///////////!!!!!!!!!!!!!//////////////////

//VALORES PLAYER	
players[socket.id] = {
x: randomX, y: randomY,
color: assignedColors.get(socket.id).color,
nombre: assignedColors.get(socket.id).name,
puntos: 0,
velocidad: false,
skinCode: skinCode
};	

socket.emit('assignColor', { color: userColor, name: playerName});
io.emit('updatePlayers2', players);	
console.log(`Color asignado a ${socket.id}: ${assignedColors.get(socket.id)}`);

socket.on('updatePlayersRequest', () => {
console.log(`updatePlayersRequest Function`);
io.emit('updatePlayers', players);
});	

//ACTUALIZAR POSICION JUGADOR	
socket.on('updatePosition', function (position) {
console.log(`Update Position: ${players[socket.id].nombre}`);
// Actualiza la posición del jugador en el servidor
players[socket.id].x = position.x;
players[socket.id].y = position.y;
players[socket.id].velocidad = position.velocidad;
// Emite la actualización a todos los clientes
socket.emit('updatePlayers', { [socket.id]: players[socket.id] });
});

//ACTUALIZAR VELOCIDAD JUGADOR	
socket.on('updateVelocidadServer', function (position) {
players[socket.id].velocidad = position.velocidad;
// Emite la actualización a todos los clientes
socket.emit('updateVelocidadCliente', { [socket.id]: { velocidad: players[socket.id].velocidad } });
});	
	
//MOVER JUGADOR EN CLIENTE	
socket.on('animationData', function (data) {
const playerName = assignedColors.get(socket.id).name;
const playerSpeed = players[socket.id].velocidad; // Acceso a la velocidad del jugador
console.log(`Annimation Speed: ${playerSpeed}`);
// Emitir datos a todos los clientes
io.emit('animateBluePoint', { playerId: socket.id, data: data, playerName: playerName, playerSpeed: playerSpeed });
});
	
///SISTEMA PUNTOS CUNADO CIRCULO VERDE HA SIDO COMIDO////////////////////
socket.on('greenCircleEaten', () => {
const playerId = socket.id;
players[playerId].puntos += 1; 
io.emit('updatePlayers', players); 
// Actualizar la información de los jugadores para todos
io.emit('updatePlayers2', players);
console.log(`+ Puntos: ${players[playerId].puntos}, ${players[playerId].nombre} `);
});	  

//COLISION GREEN CIRCLE BORRAR EN TODOS CLIENTES	
socket.on('collisionWithGreenCircle2', (collisionIndex, indexToRemove, comproid) => {
var indice = greenCirclesS.findIndex(function(elemento) {
return elemento.z === collisionIndex; });
if (indice !== -1) {
console.log("Elemento eliminado correctamente", greenCirclesS[indice]);
greenCirclesS.splice(indice, 1);
} else {
console.log("No se encontró ningún elemento con z igual a 10"); }        
io.emit('greenCircleCollision', collisionIndex, indexToRemove, comproid);
console.log(`GreenCircleS QUEDAN: ${greenCirclesS.length}:`);	
	
// Comprobar si quedan menos de 5 círculos verdes
if (greenCirclesS.length < 5) {
io.emit('borrarGreen');
greenCirclesS = [];	
// Generar 15 círculos verdes nuevos
const newGreenCircles = generateRandomLineCoordinates();
for (let i = 0; i < newGreenCircles.length; i++) {
newGreenCircles[i].z = greenCirclesS.length + i + 1; }
// Agregar los nuevos círculos verdes a la lista existente
greenCirclesS.push(...newGreenCircles);
console.log(`GreenCircleS RENOVADO: ${greenCirclesS.length}:`);	

io.emit('greenCirclesGenerated', greenCirclesS);
}		
});	

////////////////////////////////////////////////////////////////////////////    

//ELIMINAR JUGADOR DE TODOS CLIENTES
socket.on('eliminarJugador', (playerIdN) => {
console.log('Usuario desconectado', playerIdN);
assignedColors.delete(playerIdN);
connectedUsers.delete(playerIdN);
delete players[playerIdN]; 
io.emit('updatePlayers', players); 
io.emit('userCount', connectedUsers.size);
io.emit('eliminarJugadorEnCliente', playerIdN);
});		

////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//USUARIOS DESCONECTADOS SISTEMA DE DESCONEXION
socket.on('disconnect', async () => {
//HIGHSCORE SYSTEM // UPDATE Highscore.TXT
if (players[socket.id] && players[socket.id].puntos) {
console.log('Update highscore');
const playerScore = {
name: players[socket.id].nombre, score: players[socket.id].puntos, color: players[socket.id].color };
try { await uploadUpdatedHighscores(playerScore);
console.log('Highscore updated successfully for player:', playerScore);
} catch (error) { console.error('Error updating highscore:', error.message); }	
}
//END HIGHSCORE SYSTEM // Highscore.txt	

//ELIMINAR JUGADOR // FUNCION EN CLIENTE INDEX	
io.emit('eliminarJugadorEnCliente', socket.id);
console.log('Usuario desconectado', socket.id);
assignedColors.delete(socket.id);
connectedUsers.delete(socket.id);
delete players[socket.id]; 
io.emit('updatePlayers', players); 
io.emit('updatePlayers2', players);
io.emit('userCount', connectedUsers.size);
});



//END SOCKET CONNECTION////////////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////   
///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    

});
});


//HIGHSCORE SYSTEM SAVE, UPDATE!!! HIGH SCORE //// ///// ////
//HIGHSCORE SYSTEM SAVE, UPDATE!!! HIGH SCORE //// ///// ////
//HIGHSCORE SYSTEM SAVE, UPDATE!!! HIGH SCORE //// ///// ////
//Proceso para hacerlo: desde Github web. settings. Create new personal Token. Repo checked. Copy Token API CODE. Paste Api Token code on Render Environment Key. And Code below change user info. highscore.txt

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'callmdog';
const REPO_NAME = 'hex2';
const FILE_PATH = 'public/highscore.txt';

async function getCurrentHighscores2() {
const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
try {
const response = await axios.get(url, {
headers: { 'Authorization': `token ${GITHUB_TOKEN}`,
'Accept': 'application/vnd.github.v3+.raw' }
});
console.log('Response:', response.data);
if (!response.data) { throw new Error('Response does not contain data.'); }
// Si la respuesta es una cadena (contenido bruto)
if (typeof response.data === 'string') { return { content: response.data, sha: null }; }
// Si la respuesta es un objeto (metadatos del archivo)
if (!response.data.content) { throw new Error('Response does not contain content.'); }
const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
const sha = response.data.sha;
if (!sha) { throw new Error('Response does not contain SHA.'); }
return { content, sha };
} catch (error) {
console.error('Error in getCurrentHighscores:', error.response ? error.response.data : error.message);
throw error; }
}

async function getCurrentHighscores() {
const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
try {
const response = await axios.get(url, {
headers: { 'Authorization': `token ${GITHUB_TOKEN}`,
'Accept': 'application/vnd.github.v3+.raw' }
});
if (!response.data) { throw new Error('Response does not contain data.'); }
let content;
if (typeof response.data === 'string') { content = response.data; } else {
if (!response.data.content) { throw new Error('Response does not contain content.'); }
content = Buffer.from(response.data.content, 'base64').toString('utf-8');
}
// Divide el contenido en líneas y procesa cada línea como JSON
const lines = content.trim().split('\n');
let jsonData = [];
lines.forEach(line => {
try {
const obj = JSON.parse(line);
jsonData.push(obj);
} catch (error) { console.error('Error al analizar JSON:', error); }
});
// Retorna los datos JSON procesados
return jsonData;
} catch (error) {
console.error('Error in getCurrentHighscores:', error.response ? error.response.data : error.message);
throw error; }
}

async function updateHighscores(newScore) {
const { content, sha } = await getCurrentHighscores2();
// Asegurarse de que newScore sea una cadena
const scoreString = typeof newScore === 'object' ? JSON.stringify(newScore) : newScore;
const updatedContent = content + `\n${scoreString}`;
const base64Content = Buffer.from(updatedContent).toString('base64');
return { base64Content, sha };
}

async function uploadUpdatedHighscores(newScore) {
const { base64Content, sha } = await updateHighscores(newScore);
if (!sha) { throw new Error('SHA is missing. Cannot update file without SHA.'); }
const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
const response = await axios.put(url, {
message: 'Update highscore.txt', content: base64Content, sha: sha }, {
headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
});
return response.data;
}

app.post('/update-highscore', async (req, res) => {
const { score } = req.body;
try {
const result = await uploadUpdatedHighscores(score);
res.json(result);
} catch (error) { res.status(500).json({ error: error.message }); }
});
//END HIGHSCORE SYSTEM SAVE, UPDATE!!! HIGH SCORE //// ///// ////

//PORT SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
