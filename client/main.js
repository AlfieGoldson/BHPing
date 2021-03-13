const pingsColors = {
	good: '#a2dfb6aa',
	avg: '#f6c447aa',
	belowAvg: '#f2a565aa',
	bad: '#cd6674aa',
	failed: '#101217aa',
};

const worldParts = {};

function addWorldPart(name, pos, textPos) {
	worldParts[name] = {
		svg: new XMLSerializer().serializeToString(
			document.getElementById(`${name}_svg`)
		),
		pos,
		textPos,
	};
}

addWorldPart('AUS', [1535, 669, 360, 300], [1680, 827]);
addWorldPart('BRS', [387, 621, 229, 405], [537, 723]);
addWorldPart('EU', [732, 143, 1021, 743], [884, 345]);
addWorldPart('JPN', [1628, 343, 50, 84], [1680, 400]);
addWorldPart('SEA', [1266, 306, 479, 416], [1568, 585]);
addWorldPart('US-E', [181, 115, 608, 697], [360, 420]);
addWorldPart('US-W', [26, 181, 232, 306], [140, 320]);

const App = {
	data() {
		return {
			servers: [],
			canvas: null,
		};
	},
	async mounted() {
		const ws = new WebSocket('ws://localhost:9911');

		const canvas = document.getElementById('worldmap');
		var ctx = canvas.getContext('2d');
		this.canvas = ctx;

		// ws.onopen = () => {
		// 	ws.send('TEST');
		// };

		ws.onmessage = (e) => {
			try {
				const data = JSON.parse(e.data);
				const server = this.servers.find((s) => s.name === data.name);

				if (!server) {
					this.servers.push(data);
					updateCanvas(this.canvas, this.servers);
				} else if (
					data.active !== server.active ||
					data.latency !== server.latency
				) {
					server.active = data.active;
					server.latency = data.latency;
					updateCanvas(this.canvas, this.servers);
				}
			} catch (e) {
				console.error(e);
			}
		};
	},
};

Vue.createApp(App).mount('#App');

function updateCanvas(canvas, servers) {
	if (!canvas) return;
	canvas.clearRect(0, 0, 1920, 1080);
	// const worldImg = new Image();
	// worldImg.src = './assets/WorldMap.svg';
	// canvas.drawImage(worldImg, 26, 116, 1867, 847);

	for (server of servers) {
		const { name, latency, active } = server;
		const img = new Image();

		const worldPart = worldParts[name];

		let pingColor =
			latency < 0 || !active
				? pingsColors.failed
				: latency < 40
				? pingsColors.good
				: latency < 80
				? pingsColors.avg
				: latency < 120
				? pingsColors.belowAvg
				: pingsColors.bad;

		const coloredSVG = encodeURIComponent(
			worldPart.svg.replace(/fill="#[0-9a-f]+"/g, `fill="${pingColor}"`)
		);

		img.src = `data:image/svg+xml;utf-8,${coloredSVG}`;

		canvas.drawImage(img, ...worldPart.pos);

		canvas.font = 'normal 64px Rubik';
		canvas.fillStyle = 'white';
		canvas.textAlign = 'center';

		canvas.fillText(`${latency}ms`, ...worldPart.textPos);

		canvas.font = 'bold 24px Rubik';
		canvas.fillText(name, worldPart.textPos[0], worldPart.textPos[1] + 32);
	}
}
