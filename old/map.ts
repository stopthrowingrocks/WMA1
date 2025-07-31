class Map {
	constructor(layout){
		this.size = [layout.reduce((a, row) => Math.max(a, row.length), 0), layout.length];
		this.playerEntities = [];
		this.dynamicEntities = [];
		this.staticEntities = layout.map((row, y) => new Array(this.size[0]).fill(0).map((_, x) => {
			if(row[x] == "@"){
				this.playerEntities.push(new Game.DynamicEntity(row[x], [x,y]));
				return ".";
			} else if(Game.getEntityProto(row[x]).dynamic){
				this.dynamicEntities.push(new Game.DynamicEntity(row[x], [x,y]));
				return ".";
			} else {
				return row[x]||" ";
			}
		}));
	}
	getStaticEntityAt(pos){
		return new Game.Entity(this.staticEntities[pos[1]][pos[0]],pos);
	}
	getEntitiesAt(pos){
		return [this.getStaticEntityAt(pos), ...this.dynamicEntities.concat(this.playerEntities).filter(v => v.pos[0] == pos[0] && v.pos[1] == pos[1])]
	}
	// Returns players, then dynamic elements, then the static element
	getVisibleEntityAt(pos){
		return this.getEntitiesAt(pos).last();
	}
	setStaticEntity(type, pos){
		this.staticEntities[pos[1]][pos[0]] = type;
	}
	addEntity(type, pos){
		if(type == "@"){
			this.playerEntities.push(new Game.DynamicEntity(type, pos));
		} else if(Game.getEntityProto(type).dynamic){
			this.dynamicEntities.push(new Game.DynamicEntity(type, pos));
		} else {
			this.setStaticEntity(type, pos);
		}
	}
	kill(E){
		E.killed = true;
		if(E.type === "@"){
			const index = this.playerEntities.indexOf(E);
			if(index != -1){
				this.playerEntities.splice(index,1);
			}
		} else if(E.proto.dynamic){
			const index = this.dynamicEntities.indexOf(E);
			if(index != -1){
				this.dynamicEntities.splice(index,1);
			}
		} else {
			this.setStaticEntity(".", E.pos);
		}
	}
}

Game.Map = Map;
