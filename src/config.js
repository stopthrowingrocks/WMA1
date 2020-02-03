Game.canvasSize = [400, 300];
Game.tileSize = [16, 25];
Game.posToCoords = pos => pos.map((v,i)=>(v-Game.map.size[i]/2)*Game.tileSize[i]+Game.canvasSize[i]/2);
Game.loading = 2;

Game.DIR = {
	UP: [0,-1],
	DOWN: [0,+1],
	LEFT: [-1,0],
	RIGHT: [+1,0]
};
Game.KEYS = {
	UP: {
		keyCodes: [38, 87],
		fn: ()=>Game.movePlayer(Game.DIR.UP)
	},
	DOWN: {
		keyCodes: [40, 83],
		fn: ()=>Game.movePlayer(Game.DIR.DOWN)
	},
	LEFT: {
		keyCodes: [37, 65],
		fn: ()=>Game.movePlayer(Game.DIR.LEFT)
	},
	RIGHT: {
		keyCodes: [39, 68],
		fn: ()=>Game.movePlayer(Game.DIR.RIGHT)
	},
	RESTART: {
		keyCodes: [82],
		fn: ()=>{
			Game.loadLevel(Game.page);
			Game.drawAll();
		}
	}
}

Game.PROTO = {
	"@": {
		color: "#0f0",
		dynamic: true,
		canMoveInto(self, dpos, E){
			return E.type == "@";
		}
	},
	".": {
		color: "#641"
	},
	"#": {
		color: "#bbb",
		canMoveInto(self, dpos, E){
			return false;
		}
	},
	" ": {
		canMoveInto(self, dpos, E){
			return false;
		}
	},
	"O": {
		color: "#3df",
		moveInto(self, dpos, E){
			Game.map.kill(E);
			Game.map.kill(self);
		}
	},
	"X": {
		color: "#f4b",
		moveInto(self, dpos, E){
			Game.map.kill(self);
			Game.map.kill(E);
			Game.map.addEntity("#", self.pos);
		}
	},
	"|": {
		color: "#96c",
		moveInto(self, dpos, E){
			Game.map.kill(self);
			Game.map.addEntity("#", self.pos);
		}
	},
	"0": {
		color: "#c99",
		dynamic: true,
		canMoveInto(self, dpos, E){
			return self.canMoveBy(dpos);
		},
		moveInto(self, dpos, E){
			self.moveBy(dpos);
		}
	},
	"~": {
		color: "#22f",
		moveInto(self, dpos, E){
			E.moveByDelayed(dpos);
		}
	},
	"^": {
		color: "#ec3",
		moveInto(self, dpos, E){
			E.moveByDelayed(Game.DIR.UP);
		}
	},
	"v": {
		color: "#ec3",
		moveInto(self, dpos, E){
			E.moveByDelayed(Game.DIR.DOWN);
		}
	},
	"<": {
		color: "#ec3",
		moveInto(self, dpos, E){
			E.moveByDelayed(Game.DIR.LEFT);
		}
	},
	">": {
		color: "#ec3",
		moveInto(self, dpos, E){
			E.moveByDelayed(Game.DIR.RIGHT);
		}
	}
};

//Include default values
Game.getEntityProto = type => {
	return Object.assign({
		color: "#fff",
		dynamic: false,
		canMoveInto(self, dpos, E){
			return true;
		},
		moveInto(self, dpos, E){}
	}, Game.PROTO[type]);
};