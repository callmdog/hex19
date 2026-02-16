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


////////////////////////////////////////////////////////////////////////////    
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
//USUARIOS DESCONECTADOS SISTEMA DE DESCONEXION
socket.on('disconnect', async () => {

});


//END SOCKET CONNECTION////////////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////   
///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    ///////    

});
});


//PORT SERVER
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
