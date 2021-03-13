const WebSocket = require('ws');
const ping = require('jjg-ping');
const { app, BrowserWindow } = require('electron');

const wss = new WebSocket.Server({ port: 9911 });

let sockets = [];

wss.on('connection', function connection(ws) {
	console.log('Client Connected!');

	sockets.push(ws);

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});

	ws.on('close', () => {
		sockets = sockets.filter((s) => s !== ws);
	});
});

function createWindow() {
	const win = new BrowserWindow({
		width: 480,
		height: 270,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	win.removeMenu();

	win.loadFile('./client/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

let servers = [];

const addServer = (name, host) =>
	servers.push({ name, host, active: false, latency: -1 });

const updateServer = (name, active, latency) => {
	const server = servers.find((s) => s.name === name);
	server.act = active;
	server.latency = latency;

	// console.log(`${name}: ${active ? `${latency}ms` : 'Cannot Reach Server'}`);

	for (ws of sockets) {
		ws.send(JSON.stringify({ name, active, latency }));
	}
};

addServer('US-E', 'pingtest-atl.brawlhalla.com');
addServer('US-W', 'pingtest-cal.brawlhalla.com');
addServer('EU', 'pingtest-ams.brawlhalla.com');
addServer('SEA', 'pingtest-sgp.brawlhalla.com');
addServer('AUS', 'pingtest-aus.brawlhalla.com');
addServer('BRS', 'pingtest-brs.brawlhalla.com');
addServer('JPN', 'pingtest-jpn.brawlhalla.com');

function pingServer(server) {
	ping.system.ping(server.host, (latency, active) =>
		updateServer(server.name, active, latency)
	);
}

setInterval(() => {
	for (server of servers) {
		pingServer(server);
	}
}, 1000);
