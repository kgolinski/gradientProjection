//controls : H, M, C, A
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
	colors = {values:[],names:[]},
	points = [],
	colorToChange = 0,
	step = 0,
	config,
	mode,
	rpp=5,
	draggedPoint = -1,
	fade = false;
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
	gui.add(config, 'toggleDistortion');
	gui.add(config, 'newColor');
	
	resize();
	initListeners();
	initColors();
	initPoints();
	setInterval(draw,1000.0/frameRate);
	setInterval(askTwitter,5000);
	draw();
}

/* ------------------------------------------------------------------------------------------- */

var Config = function(){
	this.animTime=2000;
	this.steps = 100;
	this.vSubdivisions = 3;
	this.hSubdivisions = 7;
	this.newColor = changeColors;
	this.distTolerance = 8;
	this.gradientStartIndex = 0;
	this.gradientStopIndex = (this.vSubdivisions+this.hSubdivisions+2);
	this.toggleDistortion = function(){ mode=(++mode)%modes; };
};

/* ------------------------------------------------------------------------------------------- */

function draw(){
  clear();
	
	var gradient = ctx.createLinearGradient(points[config.gradientStartIndex].x, points[config.gradientStartIndex].y, points[config.gradientStopIndex].x, points[config.gradientStopIndex].y);

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
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.moveTo(points[0].x,points[0].y);
	for(var i=1;i<points.length;i++){
    ctx.lineTo(points[i].x,points[i].y)
  }
  ctx.closePath();
  ctx.stroke();
  
  for(var i=0;i<points.length;i++){
    circle(points[i].x,points[i].y,config.distTolerance);
    if(i==config.gradientStartIndex || i==config.gradientStopIndex)
      filledCircle(points[i].x,points[i].y,config.distTolerance/2);
    else
      circle(points[i].x,points[i].y,config.distTolerance/2);
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

function filledCircle(x,y,radius){
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2, true); 
  ctx.closePath();
  ctx.fill();
}

/* ------------------------------------------------------------------------------------------- */

function changeColors(color){
  if(color == undefined)
    color = colors.values[Math.floor(Math.random()*colors.values.length)];
  
  if(colorToChange%2==0){
		prevColor1 = color1;
		color1 = Color(color);
	}else{
		prevColor2 = color2;
		color2 = Color(color);
	}
	console.log(colorName(color1) + " -> " + colorName(color2));
	colorToChange=(++colorToChange)%2;
	step=0;
	fade=true;
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
		fade=false;
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
    e.preventDefault();
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
}

/* ------------------------------------------------------------------------------------------- */

function drag(e){
  e.preventDefault();
  if(draggedPoint>-1){
    points[draggedPoint]=getPos(e);
  }
}

/* ------------------------------------------------------------------------------------------- */

function up(e){
  e.preventDefault();
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
  if (key=='a' || key=='A')
    askTwitter();
}

/* ------------------------------------------------------------------------------------------- */

function initPoints(){
  points = [new Vertex(width/4,height/4),
            new Vertex(width-width/4,height/4),
            new Vertex(width-width/4,height-height/4),
            new Vertex(width/4,height-height/4)
            ];
  var start = points[2],
      stop = points[3];
  for(var i=1;i<config.hSubdivisions+1;i++){
    points.splice(3,0,lerpVertex(start,stop,1-i/(config.hSubdivisions+1)))
  }
  start = points[1];
  stop = points[2];
  for(var i=1;i<config.vSubdivisions+1;i++){
    points.splice(2,0,lerpVertex(start,stop,1-i/(config.vSubdivisions+1)))
  }
  start = points[0];
  stop = points[1];
  for(var i=1;i<config.hSubdivisions+1;i++){
    points.splice(1,0,lerpVertex(start,stop,1-i/(config.hSubdivisions+1)))
  }
  start = points[0];
  stop = points[points.length-1];
  for(var i=1;i<config.vSubdivisions+1;i++){
    points.splice(points.length,0,lerpVertex(start,stop,1-i/(config.vSubdivisions+1)))
  }
}

/* ------------------------------------------------------------------------------------------- */

function initColors(){
	$("td").each(function(){
	  colors.values.push($(this).attr("bgcolor"));
	  colors.names.push($(this).text());
	});
	color1 = Color(colors.values[Math.floor(Math.random()*colors.values.length)]);
	prevColor1 = color1;
	color2 = Color(colors.values[Math.floor(Math.random()*colors.values.length)]);
	prevColor2 = color2;
	
	console.log(colorName(color1) + " -> " + colorName(color2));
}

/* ------------------------------------------------------------------------------------------- */

function askTwitter(){
  if(!fade)
  {
    $.getJSON('http://search.twitter.com/search.json?q=%23kolor&rpp='+rpp+'&page=1&callback=?',function(data){
      //console.log(data);
      var index = -1;
      for(r in data.results){
        index = parseTweet(data.results[r].text);
        if(index!=-1){
          //console.log(colors.names[index]+' in tweet')
          if(color1!=colors.values[index] && color2!=colors.values[index]){
            changeColors(colors.values[index]);
          }
          break;
        }
        //console.log(data.results[r].text);
      }
    });
  }
}

/* ------------------------------------------------------------------------------------------- */

function parseTweet(text){
  var parts = text.split(" ");
  for(var i=0;i<parts.length;i++){
    if(colorIndex(parts[i])!=-1){
      return colorIndex(parts[i]);
    } 
  }
  return -1;
}

/* ------------------------------------------------------------------------------------------- */

function colorName(color){
	return colors.names[colors.values.indexOf(color.toString())]
}

/* ------------------------------------------------------------------------------------------- */

function colorIndex(name){
  return colors.names.indexOf(name);
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
	//ctx.fillRect(0, 0, width, height);
	ctx.clearRect(0,0,width,height);
}

/* ------------------------------------------------------------------------------------------- */

function lerpVertex(start,stop,amt){
     return new Vertex(lerp(start.x,stop.x,amt),lerp(start.y,stop.y,amt));
}

/* ------------------------------------------------------------------------------------------- */

function lerp(start,stop,amt){
     return start + (stop-start) * amt;
}