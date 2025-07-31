Object.defineProperty(Array.prototype,"last",{
	value:function last(){
		return this[this.length-1];
	}
});
["forEach","map","reduce"].forEach(v=>{
	Object.defineProperty(String.prototype,v,{
		value:Array.prototype[v]
	})
});
Object.defineProperties(Object.prototype,{
	find:{
		value:function find(fn){
			const res = Object.keys(this).find(v=>fn(this[v], v, this));
			if(res === undefined){
				return undefined;
			} else {
				return this[res];
			}
		}
	}
});