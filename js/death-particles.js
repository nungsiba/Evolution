function spawnDeathParticles(scene,x,y,color=0xff2244){
  const g=scene.add.graphics().setDepth(8),ps=[];
  for(let i=0;i<12;i++){const ang=Math.random()*Math.PI*2,spd=60+Math.random()*120;ps.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,a:1.0,r:3+Math.random()*4});}
  const timer=scene.time.addEvent({delay:16,repeat:30,callback:()=>{
    g.clear();let any=false;
    for(const p of ps){p.x+=p.vx*0.016;p.y+=p.vy*0.016;p.vy+=40*0.016;p.a-=0.033;if(p.a>0){any=true;g.fillStyle(color,p.a);g.fillCircle(p.x,p.y,p.r);}}
    if(!any){timer.remove();g.destroy();}
  }});
}
