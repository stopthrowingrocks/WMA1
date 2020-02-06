const Game = {
	DOM: null,
	ctx: null,
	map: null,
	levels: [],
	audio: [],
	page: 0,
	levelTitle: "",
	dirty: [],
	eventQueue: [],
	delayedActions: [],
	frameTime: 0,
	delayed: false,
	movePlayer(dpos){
		if(Game.map.playerEntities.every(player=>player.canMoveBy(dpos))){
         // Makes sure that if a player gets killed none get skipped over
			Game.map.playerEntities.slice(0).forEach(player=>player.forceMoveBy(dpos));
		}
		Game.drawDirty();
	},
	keyPress(e){
		Game.eventQueue.push(e);
		if(!Game.delayed)Game.update();
	},
	update(){
		Game.delayed = true;
		Game.frameTime = Date.now();
		if(Game.delayedActions.length){
			Game.delayedActions.forEach(v=>v());
			Game.delayedActions=[];
			Game.drawDirty();
		} else if(Game.eventQueue.length){
			const e = Game.eventQueue.shift();
			for(const i in Game.KEYS){
				let keyObj = Game.KEYS[i];
				if(keyObj.keyCodes.includes(e.keyCode)){
					keyObj.fn();
				}
			}
		}
		if(!Game.map.playerEntities.length){
			Game.loadLevel(Game.page + 1);
			Game.delayedActions = [Game.drawAll];
		}
		Game.delayed = false;
		if(Game.delayedActions.length){
			setTimeout(Game.update, 70 + Game.frameTime - Date.now());
		} else if(Game.eventQueue.length){
			Game.update();
		}
	},
	async init(){
		// wait till the document is loaded
		await rloaded;

		d.getElementById("load").hidden = true;
		d.getElementById("gm-container").hidden = false;

		Game.DOM = {
			canvas: d.getElementById("gm-canvas"),
			levelTitle: d.getElementById("gm-level-title")
		}
		
		Game.DOM.canvas.width = 400;
		Game.DOM.canvas.height = 300;
		Game.ctx = Game.DOM.canvas.getContext("2d", {alpha: false});
		Game.ctx.textBaseline = "top";
		Game.ctx.font = "25px Share Tech Mono";

		d.onkeydown = Game.keyPress;

		// wait till the levels have been fetched
		Game.levels = await rlevels;
		Game.loadLevel(1);

		// don't draw until the fonts are loaded
		await rcss;
		Game.drawAll();
		
		d.body.style.background = "linear-gradient(#000, #000414)";
	},
	// Level Numbers are 1,2,3...
	loadLevel(levelNumber){
		const level = Game.levels[levelNumber - 1]
		Game.map = new Game.Map(level.map);
		Game.page = levelNumber;
		Game.levelTitle = level.title;
		Game.dirty = [];
	},
	drawAll(){
		Game.DOM.levelTitle.innerText = Game.levelTitle;
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

