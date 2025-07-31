import { rcss, rlevels, rloaded } from "./required";
export const Game = {
	DOM: null,
	ctx: null,
	map: null,
	levels: [],
	audio: [],
	state: {
		level: 0,
		description: "Main Menu",
		playing: false,
		delayed: false,
		menu: false,
		updating: false
	},
	levelTitle: "",
	dirty: [],
	eventQueue: [],
	urgentQueue: [],
	delayedActions: [],
	frameTime: 0,
	movePlayer(dpos){
		if (Game.map) {
			if(Game.map.playerEntities.every(player=>player.canMoveBy(dpos))){
				// Makes sure that if a player gets killed none get skipped over
				Game.map.playerEntities.slice(0).forEach(player=>player.forceMoveBy(dpos));
			}
			Game.drawDirty();
		}
	},
	keyPress(e){
		let key = Game.getKey(e.keyCode);
		if(key)Game[key.urgent?"urgentQueue":"eventQueue"].push(key);
		if(!Game.state.delayed)Game.update();
	},
	update(){
		Game.updating = true;
		Game.frameTime = Date.now();

		if(Game.urgentQueue.length){
			Game.urgentQueue.shift().fn();
		} else if(Game.delayedActions.length){
			// Must be in this order so that delayed actions can produce further delayed actions for the next step
			const actions = Game.delayedActions;
			Game.delayedActions = [];
			actions.forEach(v=>v());
			Game.drawDirty();
		} else if(Game.eventQueue.length){
			Game.eventQueue.shift().fn();
		}
		if(!Game.map.playerEntities.length){
			Game.loadLevel(Game.state.level + 1);
			Game.delayedActions = [Game.drawAll];
		}

		Game.state.delayed = false;
		Game.state.updating = false;
		
		if(Game.delayedActions.length){
			Game.state.delayed = true;
			setTimeout(Game.update, 70 + Game.frameTime - Date.now());
		} else {
			if(Game.eventQueue.length){
				Game.update();
			}
		}
	},
	async init(){
		// wait till the document is loaded
		await rloaded;

		document.getElementById("load").hidden = true;
		document.getElementById("gm-container").hidden = false;

		Game.DOM = {
			canvas: document.getElementById("gm-canvas"),
			description: document.getElementById("gm-description")
		}
		
		Game.DOM.canvas.width = Game.canvasSize[0];
		Game.DOM.canvas.height = Game.canvasSize[1];
		Game.ctx = Game.DOM.canvas.getContext("2d", {alpha: false});
		Game.ctx.textBaseline = "top";
		Game.ctx.font = "25px Share Tech Mono";

		document.onkeydown = Game.keyPress;

		// wait till the levels have been fetched
		Game.levels = await rlevels;
		Game.loadLevel(1);

		// don't draw until the fonts are loaded
		await rcss;
		Game.drawAll();
		
		document.body.style.background = "linear-gradient(#000, #000414)";
	},
	// Level Numbers are 1,2,3...
	loadLevel(level){
		console.log(level);
		const levelMap = Game.levels[level - 1]
		Game.map = new Game.Map(levelMap.map);
		Game.state = {
			level,
			description: `Level ${level}: ${levelMap.title}`,
			playing: true,
			delayed: false,
			menu: false,
			updating: false
		};
		Game.dirty = [];
	},
	drawAll(){
		Game.DOM.description.innerText = Game.description;
		Game.ctx.fillStyle = "black";
		Game.ctx.fillRect(0,0,Game.canvasSize[0],Game.canvasSize[1]);
		for(let y=0;y<Game.map.size[1];y++){
			for(let x=0;x<Game.map.size[0];x++){
				Game.map.getVisibleEntityAt([x,y]).draw();
			}
		}
	},
	drawDirty(){
		Game.dirty.forEach(pos=>{
			Game.ctx.fillStyle = "black";
			const cpos = Game.posToCoords(pos);
			Game.ctx.fillRect(cpos[0], cpos[1], Game.tileSize[0], Game.tileSize[1]);
			Game.map.getVisibleEntityAt(pos).draw();
		});
	}
};

/*TODO:
	Game.map
		.size
*/

