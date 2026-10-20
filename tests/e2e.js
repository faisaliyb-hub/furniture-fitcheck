// End-to-end checks for fitcheck.html, run inside the page (it uses the app's own globals).
// How to run: serve the project folder (python3 -m http.server 8766), open http://localhost:8766/fitcheck.html,
// then in the browser console:  await (await import('./tests/e2e.js')).run()
// It resets the visit stored in this browser. Returns {passed, failed, results}.

export async function run(){
 const R=[];const ok=(name,cond,info)=>R.push({name,pass:!!cond,...(cond?{}:{info})});
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const errs=[];const onErr=e=>errs.push(e.message);window.addEventListener('error',onErr);
 const near=(a,b,t)=>Math.abs(a-b)<=t;
 function freshVisit(over={}){S.rooms=[];S.cur=0;
  Object.assign(S,{client:'',rep:'',name:'Room 1',type:'living',mode:'walls',shape:'rect',sketch:null,walls:[],rw:300,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[],cuts:[],obs:[],rh:260,sel:null,unit:'cm',more:false,step:1,showCl:false},over);
  if(!over.keepCatalog)setCatalog(SAMPLE.slice(),true);fixRoom();stash();load();renderCat();render()}
 function setTemplate(shape,lens){S.mode='walls';S.shape=shape;S.walls=wallsFor(shapeDef(shape));
  if(shape==='rect'){S.walls[0].len=S.walls[2].len=lens[0];S.walls[1].len=S.walls[3].len=lens[1]}else lens.forEach((l,i)=>S.walls[i].len=l);S.items=[];S.obs=[];onShapeChange(true)}
 function setSketch(d0,turns,curves,lens,depths){S.mode='walls';S.shape='sketch';S.sketch={d0,turns,curves:curves||turns.map(()=>null),preview:{pts:[[0,0],[100,0],[100,70],[0,70]],labels:null}};
  S.walls=wallsFor(shapeDef('sketch'));lens.forEach((l,i)=>S.walls[i].len=l);(depths||[]).forEach((d,i)=>{if(d&&S.walls[i].curve)S.walls[i].curve.depth=d});S.items=[];S.obs=[];onShapeChange(true)}
 function suggValid(){renderSugg();const bad=[];suggList.forEach(x=>{S.items.push({id:9e9,k:x.c.k,x:x.spot.x,y:x.spot.y,rot:x.spot.rot});
  const iss=check().filter(([t,m])=>t!=='ok'&&!m.includes('Verify access'));S.items.pop();if(iss.length)bad.push(x.c.n+': '+iss[0][1])});return{n:suggList.length,bad}}
 const issues=()=>check().filter(([t])=>t!=='ok').map(([t,m])=>t+': '+m);
 const visible=sel=>{const el=typeof sel==='string'?document.querySelector(sel):sel;return !!el&&el.offsetParent!==null};
 let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647-.5};
 function stroke(start,legs,wob=3){const P=[];let a=start;legs.forEach(L=>{const b=L.to||L,s=L.bulge||0,dx=b[0]-a[0],dy=b[1]-a[1],c=Math.hypot(dx,dy),n=Math.max(8,Math.round(c/4));
  for(let k=0;k<n;k++){const t=k/n;let x=a[0]+dx*t,y=a[1]+dy*t;if(s){const h=4*s*t*(1-t);x+=dy/c*h;y-=dx/c*h}P.push([x+rnd()*wob,y+rnd()*wob])}a=b});return P.slice(0,-2)}
 const sk=r=>r.err?'ERR':r.turns.join(' ')+(r.curves.some(Boolean)?' |'+r.curves.map(c=>c?c.side[0]:'-').join(''):'');

 // ---- units ----
 freshVisit();
 const P=(u,t)=>{S.unit=u;return parseLen(t)};
 ok('units: 4.5m in cm mode',near(P('cm','4.5m'),450,.01));
 ok('units: 14 ft 9 in',near(P('ftin','14 ft 9 in'),449.58,.05));
 ok('units: 14 9 in ft+in mode',near(P('ftin','14 9'),449.58,.05));
 ok('units: 177 1/4 inches',near(P('in','177 1/4'),450.215,.05));
 ok('units: rejects text',isNaN(P('cm','abc')));
 S.unit='ftin';ok('units: ft+in display in words',U(449.58)==='14 ft 9 in',U(449.58));
 for(const u of ['cm','m','mm','ftin','in']){S.unit=u;const bad=[450,91.44,2.54,380.5].filter(v=>!(Math.abs(parseLen(U(v,true))-v)<(u==='m'?.51:.16)));ok('units: round trip '+u,!bad.length,bad)}
 S.unit='cm';

 // ---- picture shapes ----
 freshVisit();setTemplate('rect',[450,380]);
 ok('rect: closes',S.closed);ok('rect: area 171000',usage().room===171000,usage().room);
 let sv=suggValid();ok('rect: all 13 suggestions valid',sv.n===13&&!sv.bad.length,sv);
 const L={'L-br':[450,230,200,150,250,380],'L-bl':[450,380,200,150,250,230],'L-tl':[250,380,450,230,200,150],'L-tr':[250,150,200,230,450,380]};
 const AREA={'L-br':141000,'L-bl':133500,'L-tl':141000,'L-tr':141000};  // 450 x 380 minus the missing corner
 for(const [k,v] of Object.entries(L)){setTemplate(k,v);ok(k+': closes with consistent numbers',S.closed,S.mismatch);ok(k+': area '+AREA[k],usage().room===AREA[k],usage().room);sv=suggValid();ok(k+': suggestions valid',!sv.bad.length,sv.bad)}
 setTemplate('L-br',[480,230,200,150,250,380]);ok('L-br: wrong number does not close',!S.closed);
 ok('L-br: rule message',/Wall 1 should equal wall 3 \+ wall 5/.test($('wallstat').textContent),$('wallstat').textContent);
 ok('steps: Next locked while open',(goStep(2),$('next').disabled));

 // ---- containment, gaps, door ----
 setTemplate('L-br',[450,230,200,150,250,380]);
 S.items=[{id:1,k:'sofa3',x:350,y:300,rot:0}];render();ok('L: piece in missing corner flagged',issues().some(m=>m.includes('sticks out')),issues());
 S.items=[{id:2,k:'coffee',x:100,y:100,rot:0}];const g=gaps(S.items[0]);ok('L: gaps to outline',fmt(g.gl)===50&&fmt(g.gr)===300&&fmt(g.gd)===252.5,g);
 S.items=[];render();placeDoorAt({x:350,y:228});ok('door: tap on inner wall 3',S.dwall==='2'&&near(doorRect().y1,230,.5),[S.dwall,doorRect()]);

 // ---- angled and curved walls ----
 setSketch(0,['R','R45','R45','R','R'],null,[400,150,141.42,300,250]);ok('cut corner: closes, area ~95000',S.closed&&near(usage().room,95000,150),usage().room);
 setSketch(0,['R','R45','R45','R','R'],null,[400,150,145,300,250]);ok('cut corner: 3.6 cm off still closes',S.closed);
 setSketch(0,['L45','R45','R45','L45','R','R','R','R'],null,[100,75,100,75,100,300,400,300]);ok('bay 75 cm sides: closes',S.closed);
 setSketch(0,['R','R','R','R'],[{side:'out'},null,null,null],[400,300,400,300],[60]);ok('curve out: area ~136269',S.closed&&near(usage().room,136269,150),usage().room);
 sv=suggValid();ok('curve out: suggestions valid',!sv.bad.length,sv.bad);
 S.items=[{id:5,k:'tv',x:200,y:20,rot:0}];render();ok('curve out: piece in bulge flagged',issues().some(m=>m.includes('sticks out')),issues());S.items=[];
 setSketch(0,['R','R','R','R'],[{side:'in'},null,null,null],[400,300,400,300],[60]);ok('curve in: area ~103731',S.closed&&near(usage().room,103731,150),usage().room);
 placeDoorAt({x:S.wallGeo[0].mid.x,y:S.wallGeo[0].mid.y});ok('door: tap on curve goes to a straight wall',!S.wallGeo[+S.dwall].curve);
 setSketch(0,['R135','R135','R'],[{side:'out'},{side:'out'},{side:'out'}],[300,424.26,300],[20,20,20]);ok('all-curved room closes (for the door test)',S.closed,S.mismatch);
 let crashed=false;try{placeDoorAt({x:10,y:10})}catch(e){crashed=e.message}ok('door: room with only curved walls does not crash',!crashed,crashed);

 // ---- dragging snaps to the real walls ----
 setTemplate('L-br',[450,230,200,150,250,380]);S.items=[{id:70,k:'tv',x:150,y:300,rot:0}];S.sel=null;goStep(4);await wait(20);
 const plan=$('plan'),scr=(x,y)=>{const q=plan.createSVGPoint();q.x=x;q.y=y;return q.matrixTransform(plan.getScreenCTM())};
 const drag=(from,to)=>{const a=scr(...from),b=scr(...to);plan.querySelector('[data-id="70"] rect').dispatchEvent(new PointerEvent('pointerdown',{clientX:a.x,clientY:a.y,bubbles:true,pointerId:7}));
  plan.dispatchEvent(new PointerEvent('pointermove',{clientX:b.x,clientY:b.y,bubbles:true,pointerId:7}));plan.dispatchEvent(new PointerEvent('pointerup',{clientX:b.x,clientY:b.y,bubbles:true,pointerId:7}))};
 drag([150,300],[165,300]);   // TV is 160 wide: right edge would be 245, 5 cm from the inner wall at x=250
 ok('drag: snaps to the inner wall of an L',near(body(S.items[0]).x1,250,.5),body(S.items[0]));
 const it=S.items[0];it.x=150;it.y=300;render();drag([150,300],[367,300]);   // into the missing corner, near the outer box edge
 ok('drag: does not snap into the missing corner',body(S.items[0]).x1<449,body(S.items[0]));
 S.items=[];goStep(1);
 ok('phone: plan lets the page scroll on the walls step',(goStep(2),['pan-y','auto','manipulation'].includes(getComputedStyle($('plan')).touchAction)),getComputedStyle($('plan')).touchAction);
 ok('phone: plan captures touch on the furniture step',(goStep(4),getComputedStyle($('plan')).touchAction==='none'),getComputedStyle($('plan')).touchAction);goStep(1);

 // ---- sketch reader ----
 ok('sketch: rectangle',sk(sketchToShape(stroke([30,30],[[270,30],[270,185],[30,185],[30,30]])))==='R R R R');
 ok('sketch: L-shape',sk(sketchToShape(stroke([30,30],[[270,30],[270,100],[170,100],[170,185],[30,185],[30,30]]))).split(' ').length===6);
 ok('sketch: cut corner',/R45.*R45/.test(sk(sketchToShape(stroke([30,30],[[270,30],[270,120],[200,185],[30,185],[30,30]])))));
 ok('sketch: curved wall out',/\|o---/.test(sk(sketchToShape(stroke([30,60],[{to:[270,60],bulge:45},[270,185],[30,185],[30,60]])))));
 ok('sketch: line is refused',sk(sketchToShape(Array.from({length:40},(_,i)=>[30+i*6,100])))==='ERR');

 // ---- features ----
 setTemplate('rect',[450,380]);
 S.obs=[{id:901,kind:'column',x:205,y:170,w:40,d:40,h:260}];S.items=[{id:6,k:'coffee',x:225,y:190,rot:0}];render();ok('feature: column overlap is an error',issues().some(m=>m.includes('overlaps the column')),issues());
 S.items=[];S.obs=[{id:902,kind:'window',wall:0,off:150,w:200,sill:90}];S.items=[{id:7,k:'wardrobe',x:250,y:30,rot:0}];render();ok('feature: tall piece in front of window warned',issues().some(m=>m.includes('window')),issues());
 S.items=[];S.obs=[{id:903,kind:'low',x:0,y:280,w:450,d:100,h:120}];S.items=[{id:8,k:'wardrobe',x:100,y:330,rot:0}];render();ok('feature: wardrobe under low ceiling is an error',issues().some(m=>m.includes('low ceiling')),issues());
 S.items=[];S.obs=[];S.rh=200;render();renderSugg();ok('ceiling 200: wardrobe never suggested',!suggList.some(x=>x.c.k==='wardrobe'));S.rh=260;
 setSketch(0,['R','R','R','R'],[{side:'out'},null,null,null],[400,300,400,300],[60]);S.more=true;S.obs=[{id:904,kind:'window',wall:1,off:50,w:100,sill:90}];renderFeat();render();
 const wsel=document.querySelector('#feat select[data-f=wall]');ok('feature: curved wall cannot hold a window',!!wsel&&wsel.options[0].disabled,wsel&&[...wsel.options].map(o=>o.textContent+(o.disabled?'(disabled)':'')));
 S.more=false;S.obs=[];render();

 // ---- quick rectangle mode ----
 freshVisit({mode:'rect',shape:'rect',rw:420,rl:360,dwall:'E',doff:50,cuts:[{x:300,y:260,w:120,d:100}]});
 S.items=[{id:9,k:'sofa3',x:330,y:300,rot:0}];render();ok('quick rect: piece in cut-out flagged',issues().some(m=>m.includes('cut-out')),issues());
 S.items=[];S.cuts=[];render();const beforeDoor=JSON.stringify(doorRect());
 await toWalls();ok('quick rect -> wall by wall keeps the door',S.mode==='walls'&&JSON.stringify(doorRect())===beforeDoor,[beforeDoor,doorRect()]);
 await toRect();ok('wall by wall -> quick rect keeps the door',S.mode==='rect'&&JSON.stringify(doorRect())===beforeDoor);

 // ---- rooms and quote ----
 freshVisit({client:'Test client'});setTemplate('rect',[450,380]);
 $('cat').querySelector('[data-k=sofa3]')?.click();S.items.push({id:50,k:'coffee',x:225,y:150,rot:0});render();
 $('addroom').click();await wait(10);ok('rooms: second room added',S.rooms.length===2&&S.cur===1);
 S.type='bedroom';setTemplate('rect',[400,350]);S.items=[{id:60,k:'bed',x:200,y:120,rot:0}];render();
 $('addroom').click();await wait(10);S.type='office';render();     // third room left unmeasured
 const qt=quoteText();ok('quote: total adds up (1450+340+1280)',qt.includes('Total: 3,070'),qt);
 ok('quote text: unmeasured room says not measured',/Room 3 \(Home office\), not measured/.test(qt),qt);
 buildQuote();ok('full quote: unmeasured room heading says not measured',/not measured/.test($('quote').innerHTML.split('Room 3')[2]||$('quote').innerHTML.split('Room 3')[1]||''),$('quote').querySelectorAll('h3')[3]?.textContent);
 $('rooms').querySelector('[data-r="0"]').click();await wait(10);ok('rooms: switching keeps data',S.items.length===2&&S.closed&&S.rw===450);

 // ---- catalog import ----
 let res=buildCatalog('sku,name,width_cm,depth_cm,height_cm\nA,Sofa,200,90,80\n');ok('csv: good file',!res.errs.length&&res.out.length===1);
 res=buildCatalog('sku,name,width_cm\nA,B,1\n');ok('csv: missing columns rejected',res.errs.length===1);
 res=buildCatalog('sku,name,width_cm,depth_cm,height_cm,rooms\nA,B,10,10,10,garage\n');ok('csv: bad room type rejected',res.errs.length===1);
 const dropped=setCatalog(SAMPLE.filter(c=>c.k!=='coffee'),false);ok('csv: missing SKU removed from every room',dropped===1,dropped);setCatalog(SAMPLE.slice(),true);

 // ---- old saves ----
 const legacy=[{name:'Old rect',type:'living',rw:300,rl:300,dwall:'N',dw:90,doff:40,dh:205,items:[]},
  {name:'Old walls',type:'living',mode:'walls',walls:[{len:400,turn:'R'},{len:300,turn:'R'},{len:400,turn:'R'},{len:300,turn:'R'}],rw:400,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[]},
  {name:'Old sketch',type:'living',mode:'walls',shape:'sketch',sketch:{turns:['R','R','R','R'],pts:[[0,0],[100,0],[100,70],[0,70]]},walls:[{len:400,turn:'R'},{len:300,turn:'R'},{len:400,turn:'R'},{len:300,turn:'R'}],rw:400,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[]}];
 const mig=legacy.map(r=>withRoom(r,()=>({mode:S.mode,shape:S.shape,closed:S.mode==='rect'||S.closed})));
 ok('old saves: quick rectangle',mig[0].mode==='rect');ok('old saves: wall list becomes Other shape and closes',mig[1].shape==='free'&&mig[1].closed);ok('old saves: first-version sketch still closes',mig[2].shape==='sketch'&&mig[2].closed);

 // ---- steps and options ----
 freshVisit();goStep(1);ok('steps: step 1 shows only room cards',visible('#typechips')&&!visible('#wallsbox'));
 goStep(2);ok('steps: advanced hidden by default',!visible('#modewalls'));S.more=true;render();ok('steps: More options shows advanced',visible('#modewalls'));S.more=false;render();
 goStep(4);ok('steps: furniture step shows suggestions',visible('#sugg'));goStep(1);

 window.removeEventListener('error',onErr);
 ok('no page errors during the run',!errs.length,errs);
 freshVisit();
 const failed=R.filter(r=>!r.pass);
 return{passed:R.length-failed.length,failed:failed.length,results:failed.length?failed:'all passed'};
}
