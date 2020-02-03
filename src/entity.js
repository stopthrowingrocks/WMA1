//All positions are wrapped to be between 0 and map.size-1
class Entity {
	//Returns the position this.pos + dpos
	addPos(dpos){
		return this.pos.map((v,i)=>{
			v += dpos[i];
			if(v >= Game.map.size[i]){
				return v - Game.map.size[i];
			} else if(v < 0){
				return v + Game.map.size[i];
			} else {
				return v;
			}
		});
	}
	//Returns the position this.pos - dpos
	subtractPos(dpos){
		return this.addPos([-dpos[0], -dpos[1]]);
	}
	constructor(type, pos){
		this.type = type;
		this.pos = pos;
		this.proto = Game.getEntityProto(type);

		this.killed = false;
	}
	isType(type){
		return this.type === type;
	}
	canMoveInto(E, dpos){
		return this.moving || this.proto.canMoveInto(this, dpos, E);
	}
	moveInto(E, dpos){
		return this.proto.moveInto(this, dpos, E);
	}
	draw(){
		let cpos = Game.posToCoords(this.pos);
		Game.ctx.fillStyle = this.proto.color;
		Game.ctx.fillText(this.type, cpos[0], cpos[1]);
	}
}

class DynamicEntity extends Entity {
	constructor(type, pos){
		super(type, pos);
	}
	canMoveBy(dpos){
		return Game.map.getEntitiesAt(this.addPos(dpos)).every(v => v.canMoveInto(this, dpos));
	}
	forceMoveBy(dpos){
		/* TODO: Add current position and next position to toDraw list */
		//Not sure if this ordering is correct
		Game.map.getEntitiesAt(this.addPos(dpos)).forEach(v => v.moveInto(this, dpos));
		Game.dirty.push(this.pos);
		this.pos = this.addPos(dpos);
		Game.dirty.push(this.pos);
	}
	moveBy(dpos){
		if(this.canMoveBy(dpos)){
			this.forceMoveBy(dpos);
		}
	}
	moveByDelayed(dpos){
		Game.delayedActions.push(()=>this.moveBy(dpos));
	}
}

Game.Entity = Entity;
Game.DynamicEntity = DynamicEntity;