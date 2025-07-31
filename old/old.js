function delayMove(x,y,t){
	Game.player.movable=false;setTimeout(function(){
		 Game.player.movable=null;
		 t.move(x,y);
		 if(null==Game.player.movable)Game.player.movable=true;
		 Game.draw();
	},70);
}
function Sprite(t,x,y,i,o){
	this.x=+x;
	this.y=+y;
	this.i=i;
	this.t=t;
	for(i in o)this[i]=o[i];
}
Sprite.prototype=Object.assign(Sprite.prototype,{
	move(i,j){
		 if(this.canMove(i,j)){
			  var x=+i+this.x,y=+j+this.y,_;
			  if(y>=Game.map.length)y-=Game.map.length;
			  if(y<0)y+=Game.map.length;
			  if(x>=Game.map[y].length)x-=Game.map[y].length;
			  if(x<0)x+=Game.map[y].length;
			  _=Game.getSpriteAt(x,y);
			  this.x=x;
			  this.y=y;
			  (Game.actions[_.t]||function(){})(i,j,_,this);
		 }
	},
	canMove(x,y,p){
		 var _=Game.getSpriteAt(+x+this.x,+y+this.y);
		 return(Game.isOpen[_.t]||function(){return!0;})(x,y,_,this,p);
	},
	kill(){
		 for(var i in Game.sprites)
			  if(Game.sprites[i].i>this.i)
					Game.sprites[i].i--;
		 if(this.t=='@')
			  for(i in Game.player.sprites)
					if(Game.player.sprites[i]==this)
						 Game.player.sprites.splice(i,1);
	}
});

var Game = {
	c:null,ctx:null,
	player:{
		 sprites:null,
		 move(x,y){
			  if(!Game.player.movable)return;
			  var i,j;
			  for(i of Game.player.sprites)
					if(!i.canMove(x,y))return;
			  for(i in Game.player.sprites){
					j=null;
					while(Game.player.sprites[i]!=j)
						 if(j=Game.player.sprites[i])j.move(x,y);
			  }
		 },
		 movable:null
	},
	isOpen:{
		 '#'(){},
		 ' '(){},
		 '0'(x,y,_){return _.canMove(x,y,1);},
		 '@'(x,y,_,t){return'@'==t.t;}
	},
	actions:{
		 'O'(x,y,_,t){_.kill();t.kill();},
		 'X'(x,y,_,t){Game.createSprite('#',_.x,_.y);_.kill();t.kill();},
		 '0'(x,y,_,t){_.move(x,y);},
		 '^'(x,y,_,t){delayMove(0,-1,t);},
		 'V'(x,y,_,t){delayMove(0,1,t);},
		 '>'(x,y,_,t){delayMove(1,0,t);},
		 '<'(x,y,_,t){delayMove(-1,0,t);},
		 '~'(x,y,_,t){if(t.t=='0'){_.kill();t.kill();if(typeof sploosh!='undefined')sploosh.play();}else delayMove(x,y,t);},
		 '|'(x,y,_,t){Game.createSprite('#', _.x, _.y);_.kill();},
	},
	sprites:null,
	getSpriteAt(x,y){
		 var i,j;
		 for(i in Game.player.sprites){
			  j=Game.player.sprites[i];
			  if(j.x==x&&j.y==y)return Game.player.sprites[i];
		 }
		 for(i in Game.sprites){
			  j=Game.sprites[i];
			  if(j.x==x&&j.y==y)return Game.sprites[i];
		 }
		 return{t:'.'};
	},
	createSprite(a,b,c,d){
		 var _=new Sprite(a,b,c,Game.sprites.length,d);
		 Game.sprites.push(_);
		 return _;
	},
	loadLevel(l){
		 Game.map=levels(Game.lvl=+l);
		 if(!Game.map)window.location='//droptabledata.weebly.com/dogrolld';
		 Game.player.sprites=[];
		 Game.sprites=[];
		 var i,j;
		 for(i in Game.map.slice(0,-2))
			  for(j in Game.map[i])
					if(Game.map[i][j]!='.')
						 Game.createSprite(Game.map[i][j],j,i)
		 for(i of Game.sprites)
			  if(i.t=='@')
					Game.player.sprites.push(i);
		 Game.player.movable=true;
		 return Game.draw();
	},
	draw(){
		 function c(color,chars){
			  if(chars.includes(k))Game.ctx.fillStyle=color;
			  return c;
		 }
		 Game.ctx.fillStyle='#000';
		 Game.ctx.fillRect(0,0,Game.c.width,Game.c.height);
		 
		 Game.ctx.font='40px '+font;
		 Game.ctx.fillStyle='#fff';
		 Game.ctx.textAlign='center';
		 Game.ctx.fillText('We Move As One',Game.c.width/2,80);
		 Game.ctx.textAlign='left';
		 
		 var size=30,i,j,k;
		 Game.ctx.font=size+'px '+font;
		 for(i in Game.map){
			  for(j in Game.map[i]){
					Game.ctx.fillStyle='#fff'
					if(i>=Game.map.length-2){
						 Game.ctx.fillStyle='#99f';
						 k=Game.map[i][j];
					} else {
						 k=Game.getSpriteAt(j,i).t;
						 Game.ctx.fillStyle='#fff';
						 c
							  ('#641','.')
							  ('#0f0','@')
							  ('#c99','0')
							  ('#3df','O')
							  ('#f4b','X')
							  ('#ec3','<>^V')
							  ('#96c', '|')
							  ('#22f', '~')
						 ;
					}
					Game.ctx.fillText(k,j*size/2+50,i*size+150);
			  }
		 }
		 return Game;
	},map:[]
},loaded=0;
function levels(a){return[
	[
		 '########################',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '#.@..................O.#',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '########################',
		 '',
		 'Nice and easy'
	],[ '########################',
		 '#..............#.......#',
		 '#..............#.......#',
		 '#..............#.......#',
		 '#.@......#.....#.....O.#',
		 '#........#.............#',
		 '#........#.............#',
		 '#........#.............#',
		 '########################',
		 '',
		 'My first wall'
	],[ '########################',
		 '#.............##.......#',
		 '#.............##.......#',
		 '#.............##.......#',
		 '#.@@.....##...##....OO.#',
		 '#........##............#',
		 '#........##............#',
		 '#........##............#',
		 '########################',
		 '',
		 'Doppelganger'
	],[ '########################',
		 '#......................#',
		 '#......................#',
		 '#.#@......#O.#.........#',
		 '#.O@@......#...........#',
		 '#.#@...................#',
		 '#................#O#...#',
		 '#O#....................#',
		 '########################',
		 '',
		 'Enjoy the company'
	],[ '########################',
		 '#.#.........#..........#',
		 '#.....#...#...#........#',
		 '#...#..#O.#.#....#....##',
		 '#@.0.@....#...#....#...#',
		 '#....#.##O...0.#.......#',
		 '#.....#......0.........#',
		 '#.#..........#.........#',
		 '########################',
		 '',
		 'Intro to boxes'
	],[ '########################',
		 '#..........@@@.........#',
		 '#...#################..#',
		 '#....0000........#.....#',
		 '##########...#.#.###..##',
		 '#............#.....#...#',
		 '#...#.#.#.####..#..##..#',
		 '#..........XXO..#......#',
		 '########################',
		 '',
		 'Detour Ahead'
	],[ '########################',
		 '##......#.###...#......#',
		 '#.##....#....0X0.#...O.#',
		 '#0.#.####..#....0.#....#',
		 '#@0#.#.###0#....0...#..#',
		 '#0.###.....#....#.####X#',
		 '#O.0.#0#00##.....#...0.#',
		 '###....#..#......0..#..#',
		 '########################',
		 '',
		 'R to restart'
	],[ '########################',
		 '#.......#............###',
		 '#.....#...#.....#......#',
		 '#...O...........@...#..#',
		 '#..#@0X.....O...#......#',
		 '#..........O.O.........#',
		 '#.#.....#.......#...#..#',
		 '#.......@..#...........#',
		 '########################',
		 '',
		 'Snarky Comment'
	],[ '########################',
		 '#.@.######.XX.######.@.#',
		 '#...#....#....#....#...#',
		 '#...#....#.@@.#....#...#',
		 '#...#....#....#....#...#',
		 '#...#....#0^^0#....#...#',
		 '#...#....##..##....#...#',
		 '#.O.######X..X######.O.#',
		 '########################',
		 '',
		 'Asynchronous',
	],[ '########################',
		 '#~~~~~~~~~~~~~~~~~~~~~~#',
		 '###~~~~~~#######~~~~~~~#',
		 '#O########..0..#########',
		 '#@@..........^........O#',
		 '########################',
		 '#~~~~~~~~~~~~~~~~~~~~~~#',
		 '#~~~~~~~~~~~~~~~~~~~~~~#',
		 '########################',
		 '',
		 'Clever, clever',
	],[ '########################',
		 '#@........##.........O.#',
		 '#.........|............#',
		 '########################',
		 '#@.@........|.........O#',
		 '#...^.......|.........O#',
		 '#O.O........#..........#',
		 '#...........#..........#',
		 '########################',
		 '',
		 "Don't look back",
	],[ '########################',
		 '#@>>>>.>>>V#V<>.>>>V<<<#',
		 '#V....V.>>>>>^^V...V..^#',
		 '#V....V^...#..^V...V..^#',
		 '#V....V^<<<<<^V.>>>.>>.#',
		 '#V....>>>>>>.^<V...^..V#',
		 '#V.........#V^.>V<>^..V#',
		 '#>>>>>>>>>>>>^<O.^.<<<<#',
		 '########################',
		 '',
		 'Chutes and Ladders'
	],[ '#                      #',
		 '#                      #',
		 '#                      #',
		 '###                  ###',
		 '#@.~~~~~~~~~~~~~~~~~~.O#',
		 '###                  ###',
		 '#                      #',
		 '#                      #',
		 '#                      #',
		 '',
		 "A Razor's Edge"
	],[ '########################',
		 '#@..#@..#..............#',
		 '#.~.##..#..............#',
		 '#...##..#..........#...#',
		 '##..##..#>.#........^..#',
		 '#X00~.#.#>.#....#...#..#',
		 '###O..#>~.##>^##.###...#',
		 '#O...<~~~~~~~~~~~~~~~..#',
		 '########################',
		 '',
		 'Remote Control'//i got this one
	],[ '#######################',
		 '#@.........#@#........#',
		 '#...#......#.#.######.#',
		 '#...#....#.#.#........#',
		 '#...#....#.#..........#',
		 '####.....#.##.........#',
		 '#O.......#.#O########.#',
		 '#..........#..........#',
		 '#######################',
		 '',
		 ''
	],[ '########################',
		 '#V~~~~~0.<#.........#O.#',
		 '#V~~~~~.#^#.........#..#',
		 '#V~~~~~..^#.........#..#',
		 '..~~~~~.#.<@@.......#...',
		 '#^~~~~~..V#.........#..#',
		 '#^~~~~~.#V#.........#..#',
		 '#^~~~~~0..#.........#O.#',
		 '########################',
		 '',
		 'Hole in the Wall'//working
	],[ '########################',
		 '#..................>~~~#',
		 '#@..................#.##',
		 '#...................#O##',
		 '###################^#O##',
		 '#######...##...####0<###',
		 '#.@.....0....0....0.####',
		 '#################...####',
		 '########################',
		 '',
		 'Shipping Lane'
	],[ '########################',
		 '#@...0..################',
		 '#####.#0..##############',
		 '#####...#.0........~~~~#',
		 '#########.0........#.###',
		 '#V#O#####.<<<<<<<<<#.###',
		 '#@<O################.###',
		 '#^<<<0<<<<<<<<<<<<<<<###',
		 '########################',
		 '',
		 'Give me a hand'
	],[ '########################',
		 '#......................#',
		 '#......................#',
		 '#.............#........#',
		 '#.......@....#O#.......#',
		 '#.............#........#',
		 '#......................#',
		 '#......................#',
		 '########################',
		 '',
		 'No diagonal movement'//this is the last level
	],["Okay, that should've been impossible."
	],[ '########################',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '#......................#',
		 '########################',
		 '',
		 'Text'//Standard
	]
][a-1];}
var audio = new Audio('http://www.dl-sounds.com/wp-content/uploads/edd/2016/01/Lunch-Garden-preview.mp3'),font='Comic Sans',sploosh=new Audio('//drive.google.com/uc?id=0B71U2Lk-rMz7VnZYUkZQWnRfdFE');
;
function load(){if(++loaded==2){
	loaded=0;
	Game.c=document.body.appendChild(document.createElement('canvas'));
	document.getElementById('load').hidden = true;
	Game.c.width=800;
	Game.c.height=600;
	Game.ctx=Game.c.getContext('2d');
	window.Game = Game;
	audio.play();
	audio.onpause=function(){audio.play();};
	document.onkeydown=function(e){
		 //Nice use of switch
		 if(e.keyCode<48||e.keyCode>57)e.preventDefault();
		 switch(e.keyCode){
			  case 37:case 65://OR statement
					Game.player.move(-1,0);
					break;
			  case 38:case 87:
					Game.player.move(0,-1);
					break;
			  case 39:case 68:
					Game.player.move(1,0);
					break;
			  case 40:case 83:
					Game.player.move(0,1);
					break;
			  case 82:
					Game.loadLevel(Game.lvl);
					if(++loaded==3){window.open('//bit.ly/1lTgXJf');window.location='//droptabledata.weebly.com/dogrolld';window.open('//bit.ly/1lTgXJf');}
					break;
		 }
		 Game.draw();
		 if(!Game.player.sprites.length){Game.loadLevel(Game.lvl+1);}
	};
	document.onkeyup=function(e){
		 if(e.keyCode==82)loaded=0;
	};
	setInterval(Game.draw,50);
	Game.loadLevel(1);
}}
/*TODO:
 * Gates and keys
*/
