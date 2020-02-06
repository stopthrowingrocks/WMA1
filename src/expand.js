["forEach","map","reduce"].forEach(v=>{
	String.prototype[v] = Array.prototype[v]
});
Array.prototype.last = function(){
	return this[this.length-1];
};
