//controls : H, M, C 
var MODE_DRAW = 0,
    MODE_CONFIG = 1,
    modes=2;
var canvas,
	ctx,
	width,
	height,
	gui,
	Color,
	color1,
	prevColor1,
	color2,
	prevColor2,
	frameRate = 20,
	colors = [],
	points = [],
	colorToChange = 0,
	step = 0,
	config,
	mode,
	draggedPoint = -1;
window.onload = setup;

/* ------------------------------------------------------------------------------------------- */

function setup(){
	
	Color = net.brehaut.Color;
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	mode = MODE_DRAW;
	
	config = new Config();
	var gui = new dat.GUI();
	//gui.remember(config);  	
	gui.add(config, 'animTime',0,10000).step(500);
  gui.add(config, 'steps', 0, 200);
  gui.add(config, 'distTolerance',5,50).step(1);
  gui.add(config, 'subdivisions', 1, 20).step(1);
  gui.add(config, 'toggleDistortion');
  gui.add(config, 'newColor');
  
  resize();
	initListeners();
	initColors();
	initPoints();
	
	setInterval(draw,1000.0/frameRate);
	draw();
}

/* ------------------------------------------------------------------------------------------- */

var Config = function(){
	this.animTime=5000;
	this.steps = 100;
	this.subdivisions = 4;
	this.newColor = changeColors;
	this.distTolerance = 8;
	this.toggleDistortion = function(){ mode=(++mode)%modes; };
};

/* ------------------------------------------------------------------------------------------- */

function draw(){
  clear();
	
	var gradient = ctx.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y);

	gradient.addColorStop(0, color1.blend(prevColor1,(1-step/config.steps)).toString());
	gradient.addColorStop(1, color2.blend(prevColor2,(1-step/config.steps)).toString());
	
	ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);
	for(var i=1;i<points.length;i++){
    ctx.lineTo(points[i].x,points[i].y)
  }
  ctx.closePath();
  ctx.fill();
  
  if(mode==MODE_CONFIG)
    drawHandles();
	//ctx.fillRect(0, 0, width, height);
	
}

/* ------------------------------------------------------------------------------------------- */

function drawHandles(){
  ctx.strokeStyle = "rgb(255,255,255)";
  ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);
	for(var i=1;i<points.length;i++){
    ctx.lineTo(points[i].x,points[i].y)
  }
  ctx.closePath();
  ctx.stroke();
  
  //line(points[0],points[2]);
  
  for(var i=0;i<points.length;i++){
    circle(points[i].x,points[i].y,config.distTolerance);
    circle(points[i].x,points[i].y,config.distTolerance/2);
  }
  
  //subdivisions
  for(var i=0;i<config.subdivisions+1;i++){
    line(lerpVertex(points[0],points[1],i/(config.subdivisions+1)),lerpVertex(points[3],points[2],i/(config.subdivisions+1)))
    line(lerpVertex(points[0],points[3],i/(config.subdivisions+1)),lerpVertex(points[1],points[2],i/(config.subdivisions+1)))
  }
  
}

/* ------------------------------------------------------------------------------------------- */

function line(a,b)
{
  ctx.beginPath();
  ctx.moveTo(a.x,a.y);
  ctx.lineTo(b.x,b.y)
  ctx.stroke();
}

/* ------------------------------------------------------------------------------------------- */

function circle(x,y,radius){
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2, true); 
  ctx.closePath();
  ctx.stroke();
}

/* ------------------------------------------------------------------------------------------- */

function changeColors(){
	if(colorToChange%2==0){
		prevColor1 = color1;
		color1 = colors[Math.floor(Math.random()*colors.length)];
	}else{
		prevColor2 = color2;
		color2 = colors[Math.floor(Math.random()*colors.length)]
	}
	colorToChange=(++colorToChange)%2;
	step=0;
	stepper();
}

/* ------------------------------------------------------------------------------------------- */

function stepper(){
	step++;
	if(step<config.steps)
		setTimeout(stepper,config.animTime/config.steps)
	else
	{
		prevColor1=color1;
		prevColor2=color2;
	}
}

/* ------------------------------------------------------------------------------------------- */

function initListeners(){
  canvas.onmousedown = down;
  canvas.onmouseup = up;
  document.onkeypress = keypress;
  window.onresize = resize;
}

/* ------------------------------------------------------------------------------------------- */

function resize(){
	document.getElementById("canvas").setAttribute('width', window.innerWidth);
	document.getElementById("canvas").setAttribute('height', window.innerHeight);
	width = canvas.width;
	height = canvas.height;
	$('table').attr("height",height);
}

/* ------------------------------------------------------------------------------------------- */

function down(e){
    var mouse = getPos(e);
    if(mode==MODE_CONFIG)
    {
      for(var i=0;i<points.length;i++){
        if(distance(points[i],mouse)<config.distTolerance){
          draggedPoint=i;
          canvas.onmousemove = drag;
          break;
        }
      }
    }
    console.log("canvas.click (" +mouse.x+","+mouse.y+")");
}

/* ------------------------------------------------------------------------------------------- */

function drag(e){
  if(draggedPoint>-1){
    points[draggedPoint]=getPos(e);
  }
}

/* ------------------------------------------------------------------------------------------- */

function up(){
  draggedPoint = -1;
  canvas.onmousemove = null;
}

/* ------------------------------------------------------------------------------------------- */

function getPos(e){
  mouse = new Vertex(0,0);
  if (e.pageX != undefined && e.pageY != undefined) {
    mouse.x = e.pageX;
  	mouse.y = e.pageY;
  } else {
    mouse.x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
  	mouse.y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  mouse.x -= canvas.offsetLeft;
  mouse.y -= canvas.offsetTop;
  return mouse;
}

/* ------------------------------------------------------------------------------------------- */

function keypress(e){
  var evtobj=window.event? event : e //distinguish between IE's explicit event object (window.event) and Firefox's implicit.
  var unicode=evtobj.charCode? evtobj.charCode : evtobj.keyCode
  var key=String.fromCharCode(unicode)
  if (key=='m' || key=='M')
    mode=(++mode)%modes;
  if (key=='c' || key=='C')
    changeColors();
}

/* ------------------------------------------------------------------------------------------- */

function initPoints(){
  points = [new Vertex(width/4,height/4),
            new Vertex(width-width/4,height/4),
            new Vertex(width-width/4,height-height/4),
            new Vertex(width/4,height-height/4)
            ];
}

/* ------------------------------------------------------------------------------------------- */

function initColors(){
	$("td").each(function(){colors.push(Color($(this).attr("bgcolor")))});
	
	color1 = colors[Math.floor(Math.random()*colors.length)];
	prevColor1 = color1;
	color2 = colors[Math.floor(Math.random()*colors.length)]
	prevColor2 = color2;
}

/* ------------------------------------------------------------------------------------------- */

function distance(a,b){
	return Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
}

/* ------------------------------------------------------------------------------------------- */

function constrain(a){
	if(a.x<0)
		a.x=width;
	else if(a.x>width)
		a.x=0;
	if(a.y<0)
		a.y=height;
	else if(a.y>height)
		a.y=0;
}

/* ------------------------------------------------------------------------------------------- */

Vertex = function(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
}

/* ------------------------------------------------------------------------------------------- */

function clear(){
	ctx.fillStyle = "rgb(0, 0, 0)";
	ctx.fillRect(0, 0, width, height);
	//ctx.clearRect(0,0,width,height);
}

/* ------------------------------------------------------------------------------------------- */

function lerpVertex(start,stop,amt){
     return new Vertex(lerp(start.x,stop.x,amt),lerp(start.y,stop.y,amt));
}

/* ------------------------------------------------------------------------------------------- */

function lerp(start,stop,amt){
     return start + (stop-start) * amt;
}