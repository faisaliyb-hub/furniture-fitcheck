// End-to-end checks for fitcheck.html, run inside the page (it uses the app's own globals).
// How to run: serve the project folder (python3 -m http.server 8766), open http://localhost:8766/fitcheck.html,
// then in the browser console:  await (await import('./tests/e2e.js')).run()
// It resets the visit stored in this browser. Returns {passed, failed, results}.

export async function run(){
 const R=[];const ok=(name,cond,info)=>R.push({name,pass:!!cond,...(cond?{}:{info})});
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const errs=[];const onErr=e=>errs.push(e.message);window.addEventListener('error',onErr);
 const near=(a,b,t)=>Math.abs(a-b)<=t;
 const K=OLD_KEYS;   // role -> IKEA sample SKU, e.g. K.bed is the MALM Standard Double frame
 // checks run on the samples, whatever this device has loaded (the built-in Baffi catalogue, a company pack)
 function freshVisit(over={}){S.rooms=[];S.cur=0;S.house=null;S.plan=null;S.hk=null;showShapes=false;
  Object.assign(S,{client:'',rep:'',name:'Room 1',type:'living',mode:'walls',shape:'rect',sketch:null,walls:[],rw:300,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[],cuts:[],obs:[],rh:260,sel:null,unit:'cm',more:false,step:1,showCl:false,doorSet:true,finishes:[],doorK:'',doorCol:''},over);
  if(!over.keepCatalog){applyPack(null);setCatalog(SAMPLE.slice(),true)}fixRoom();stash();load();renderCat();render()}
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
 let sv=suggValid();ok('rect: one valid suggestion per product (12)',products().filter(c=>!c.gen).length===12&&sv.n===products().length&&!sv.bad.length,sv);
 const L={'L-br':[450,230,200,150,250,380],'L-bl':[450,380,200,150,250,230],'L-tl':[250,380,450,230,200,150],'L-tr':[250,150,200,230,450,380]};
 const AREA={'L-br':141000,'L-bl':133500,'L-tl':141000,'L-tr':141000};  // 450 x 380 minus the missing corner
 for(const [k,v] of Object.entries(L)){setTemplate(k,v);ok(k+': closes with consistent numbers',S.closed,S.mismatch);ok(k+': area '+AREA[k],usage().room===AREA[k],usage().room);sv=suggValid();ok(k+': suggestions valid',!sv.bad.length,sv.bad)}
 setTemplate('L-br',[480,230,200,150,250,380]);ok('L-br: wrong number does not close',!S.closed);
 ok('L-br: rule message',/Wall 1 should equal wall 3 \+ wall 5/.test($('wallstat').textContent),$('wallstat').textContent);
 ok('screens: Next locked while the room is not measured',(goStep(1),$('next').disabled));

 // ---- containment, gaps, door ----
 setTemplate('L-br',[450,230,200,150,250,380]);
 S.items=[{id:1,k:K.sofa3,x:350,y:300,rot:0}];render();ok('L: piece put in the missing corner moves back inside',rectInRoom(body(S.items[0]))&&!issues().some(m=>m.includes('sticks out')),issues());
 S.items=[{id:2,k:K.coffee,x:100,y:100,rot:0}];const g=gaps(S.items[0]);ok('L: gaps to outline',fmt(g.gl)===55&&fmt(g.gr)===305&&fmt(g.gd)===252.5,g);   // LACK 90 x 55 centred at (100, 100)
 S.items=[];render();placeDoorAt({x:350,y:228});ok('door: tap on inner wall 3',S.dwall==='2'&&near(doorRect().y1,230,.5),[S.dwall,doorRect()]);

 // ---- angled and curved walls ----
 setSketch(0,['R','R45','R45','R','R'],null,[400,150,141.42,300,250]);ok('cut corner: closes, area ~95000',S.closed&&near(usage().room,95000,150),usage().room);
 setSketch(0,['R','R45','R45','R','R'],null,[400,150,145,300,250]);ok('cut corner: 3.6 cm off still closes',S.closed);
 setSketch(0,['L45','R45','R45','L45','R','R','R','R'],null,[100,75,100,75,100,300,400,300]);ok('bay 75 cm sides: closes',S.closed);
 setSketch(0,['R','R','R','R'],[{side:'out'},null,null,null],[400,300,400,300],[60]);ok('curve out: area ~136269',S.closed&&near(usage().room,136269,150),usage().room);
 sv=suggValid();ok('curve out: suggestions valid',!sv.bad.length,sv.bad);
 S.items=[{id:5,k:K.tv,x:200,y:-60,rot:0}];render();ok('curve out: piece past the bulge moves back inside',rectInRoom(body(S.items[0]))&&!issues().some(m=>m.includes('sticks out')),issues());S.items=[];
 setSketch(0,['R','R','R','R'],[{side:'in'},null,null,null],[400,300,400,300],[60]);ok('curve in: area ~103731',S.closed&&near(usage().room,103731,150),usage().room);
 placeDoorAt({x:S.wallGeo[0].mid.x,y:S.wallGeo[0].mid.y});ok('door: tap on curve goes to a straight wall',!S.wallGeo[+S.dwall].curve);
 setSketch(0,['R135','R135','R'],[{side:'out'},{side:'out'},{side:'out'}],[300,424.26,300],[20,20,20]);ok('all-curved room closes (for the door test)',S.closed,S.mismatch);
 let crashed=false;try{placeDoorAt({x:10,y:10})}catch(e){crashed=e.message}ok('door: room with only curved walls does not crash',!crashed,crashed);

 // ---- dragging snaps to the real walls ----
 setTemplate('L-br',[450,230,200,150,250,380]);S.items=[{id:70,k:K.tv,x:150,y:300,rot:0}];S.sel=null;goStep(2);await wait(20);
 const plan=$('plan'),scr=(x,y)=>{const q=plan.createSVGPoint();q.x=x;q.y=y;return q.matrixTransform(plan.getScreenCTM())};
 const drag=(from,to)=>{const a=scr(...from),b=scr(...to);plan.querySelector('[data-id="70"] rect').dispatchEvent(new PointerEvent('pointerdown',{clientX:a.x,clientY:a.y,bubbles:true,pointerId:7}));
  plan.dispatchEvent(new PointerEvent('pointermove',{clientX:b.x,clientY:b.y,bubbles:true,pointerId:7}));plan.dispatchEvent(new PointerEvent('pointerup',{clientX:b.x,clientY:b.y,bubbles:true,pointerId:7}))};
 drag([150,300],[165,300]);   // TV is 160 wide: right edge would be 245, 5 cm from the inner wall at x=250
 ok('drag: snaps to the inner wall of an L',near(body(S.items[0]).x1,250,.5),body(S.items[0]));
 const it=S.items[0];it.x=150;it.y=300;render();drag([150,300],[367,300]);   // into the missing corner, near the outer box edge
 ok('drag: does not snap into the missing corner',body(S.items[0]).x1<449,body(S.items[0]));
 S.items=[];goStep(1);
 ok('phone: plan lets the page scroll on the measure screen',(goStep(1),['pan-y','auto','manipulation'].includes(getComputedStyle($('plan')).touchAction)),getComputedStyle($('plan')).touchAction);
 ok('phone: plan captures touch on the furniture screen',(goStep(2),getComputedStyle($('plan')).touchAction==='none'),getComputedStyle($('plan')).touchAction);goStep(1);

 // ---- sketch reader ----
 ok('sketch: rectangle',sk(sketchToShape(stroke([30,30],[[270,30],[270,185],[30,185],[30,30]])))==='R R R R');
 ok('sketch: L-shape',sk(sketchToShape(stroke([30,30],[[270,30],[270,100],[170,100],[170,185],[30,185],[30,30]]))).split(' ').length===6);
 ok('sketch: cut corner',/R45.*R45/.test(sk(sketchToShape(stroke([30,30],[[270,30],[270,120],[200,185],[30,185],[30,30]])))));
 ok('sketch: curved wall out',/\|o---/.test(sk(sketchToShape(stroke([30,60],[{to:[270,60],bulge:45},[270,185],[30,185],[30,60]])))));
 ok('sketch: line is refused',sk(sketchToShape(Array.from({length:40},(_,i)=>[30+i*6,100])))==='ERR');

 // ---- features ----
 setTemplate('rect',[450,380]);
 S.obs=[{id:901,kind:'column',x:205,y:170,w:40,d:40,h:260}];S.items=[{id:6,k:K.coffee,x:225,y:190,rot:0}];render();ok('feature: column overlap is an error',issues().some(m=>m.includes('overlaps the column')),issues());
 S.items=[];S.obs=[{id:902,kind:'window',wall:0,off:150,w:200,sill:90}];S.items=[{id:7,k:K.wardrobe,x:250,y:30,rot:0}];render();ok('feature: tall piece in front of window warned',issues().some(m=>m.includes('window')),issues());
 S.items=[];S.obs=[{id:903,kind:'low',x:0,y:280,w:450,d:100,h:120}];S.items=[{id:8,k:K.wardrobe,x:100,y:330,rot:0}];render();ok('feature: wardrobe under low ceiling is an error',issues().some(m=>m.includes('low ceiling')),issues());
 S.items=[];S.obs=[];S.rh=170;render();renderSugg();ok('ceiling 170: nothing taller is suggested',suggList.length&&!suggList.some(x=>x.c.h>170),suggList.map(x=>x.c.n));
 ok('ceiling 170: the low BILLY is offered instead of the tall one',suggList.some(x=>x.c.k==='302.638.44'&&x.from&&x.from.k===K.shelf));S.rh=260;
 setSketch(0,['R','R','R','R'],[{side:'out'},null,null,null],[400,300,400,300],[60]);S.more=true;S.obs=[{id:904,kind:'window',wall:1,off:50,w:100,sill:90}];renderFeat();render();
 const wsel=document.querySelector('#feat select[data-f=wall]');ok('feature: curved wall cannot hold a window',!!wsel&&wsel.options[0].disabled,wsel&&[...wsel.options].map(o=>o.textContent+(o.disabled?'(disabled)':'')));
 S.more=false;S.obs=[];render();

 // ---- quick rectangle mode ----
 freshVisit({mode:'rect',shape:'rect',rw:420,rl:360,dwall:'E',doff:50,cuts:[{x:300,y:260,w:120,d:100}]});
 S.items=[{id:9,k:K.sofa3,x:330,y:300,rot:0}];render();ok('quick rect: piece in cut-out flagged',issues().some(m=>m.includes('cut-out')),issues());
 S.items=[];S.cuts=[];render();const beforeDoor=JSON.stringify(doorRect());
 await toWalls();ok('quick rect -> wall by wall keeps the door',S.mode==='walls'&&JSON.stringify(doorRect())===beforeDoor,[beforeDoor,doorRect()]);
 await toRect();ok('wall by wall -> quick rect keeps the door',S.mode==='rect'&&JSON.stringify(doorRect())===beforeDoor);

 // ---- rooms and quote ----
 freshVisit({client:'Test client'});setTemplate('rect',[450,380]);
 $('cat').querySelector(`[data-k="${K.sofa3}"]`)?.click();S.items.push({id:50,k:K.coffee,x:225,y:150,rot:0});render();
 $('addroom').click();await wait(10);ok('rooms: second room added',S.rooms.length===2&&S.cur===1);
 S.type='bedroom';setTemplate('rect',[400,350]);S.items=[{id:60,k:K.bed,x:200,y:120,rot:0}];render();
 $('addroom').click();await wait(10);S.type='office';render();     // third room left unmeasured
 const qt=quoteText();ok('quote: total adds up (449+19+139)',qt.includes('Total: 607'),qt);
 ok('quote: says where sample prices come from',qt.includes('IKEA UK')&&qt.includes('GBP'),qt);
 ok('quote text: unmeasured room says not measured',/Room 3 \(Home office\), not measured/.test(qt),qt);
 buildQuote();ok('full quote: unmeasured room heading says not measured',/not measured/.test($('quote').innerHTML.split('Room 3')[2]||$('quote').innerHTML.split('Room 3')[1]||''),$('quote').querySelectorAll('h3')[3]?.textContent);
 $('rooms').querySelector('[data-r="0"]').click();await wait(10);ok('rooms: switching keeps data',S.items.length===2&&S.closed&&S.rw===450);

 // ---- catalog import ----
 let res=buildCatalog('sku,name,width_cm,depth_cm,height_cm\nA,Sofa,200,90,80\n');ok('csv: good file',!res.errs.length&&res.out.length===1);
 res=buildCatalog('sku,name,width_cm\nA,B,1\n');ok('csv: missing columns rejected',res.errs.length===1);
 res=buildCatalog('sku,name,width_cm,depth_cm,height_cm,rooms\nA,B,10,10,10,garage\n');ok('csv: bad room type rejected',res.errs.length===1);
 res=buildCatalog('sku,name,width_cm,depth_cm,height_cm,group,size\nA1,Bed small,100,200,90,bedx,Small\nA2,Bed big,160,200,90,bedx,Big\nB,Chair,45,50,80,,\n');
 ok('csv: group and size columns',!res.errs.length&&res.out[0].g==='bedx'&&res.out[1].z==='Big'&&!res.out[2].g,res.out);
 const dropped=setCatalog(SAMPLE.filter(c=>c.k!==K.coffee),false);ok('csv: missing SKU removed from every room',dropped===1,dropped);setCatalog(SAMPLE.slice(),true);
 setCatalog(res.out,false);ok('csv: rows of a group are sizes of one product',sizesOf(cat('A2')).length===2&&products().filter(c=>!c.gen).length===2,products());setCatalog(SAMPLE.slice(),true);

 // ---- old saves ----
 const legacy=[{name:'Old rect',type:'living',rw:300,rl:300,dwall:'N',dw:90,doff:40,dh:205,items:[]},
  {name:'Old walls',type:'living',mode:'walls',walls:[{len:400,turn:'R'},{len:300,turn:'R'},{len:400,turn:'R'},{len:300,turn:'R'}],rw:400,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[]},
  {name:'Old sketch',type:'living',mode:'walls',shape:'sketch',sketch:{turns:['R','R','R','R'],pts:[[0,0],[100,0],[100,70],[0,70]]},walls:[{len:400,turn:'R'},{len:300,turn:'R'},{len:400,turn:'R'},{len:300,turn:'R'}],rw:400,rl:300,dwall:'0',dw:90,doff:40,dh:205,items:[]}];
 const mig=legacy.map(r=>withRoom(r,()=>({mode:S.mode,shape:S.shape,closed:S.mode==='rect'||S.closed})));
 ok('old saves: quick rectangle',mig[0].mode==='rect');ok('old saves: wall list becomes Other shape and closes',mig[1].shape==='free'&&mig[1].closed);ok('old saves: first-version sketch still closes',mig[2].shape==='sketch'&&mig[2].closed);

 // ---- old sample keys ----
 const oldRooms=[{items:[{id:1,k:'bed'},{id:2,k:'unknown'}]}];oldKeys(oldRooms);
 ok('old saves: first-sample keys map to IKEA rows',oldRooms[0].items[0].k===K.bed&&oldRooms[0].items[1].k==='unknown',oldRooms[0].items);
 ok('old saves: every old key exists in the sample',Object.values(OLD_KEYS).every(k=>cat(k)));

 // ---- product sizes and adjustable pieces ----
 const grouped=products().filter(c=>c.g&&!c.gen);
 ok('sizes: 12 sample products, 9 with several sizes',products().filter(c=>!c.gen).length===12&&grouped.length===9&&grouped.every(c=>sizesOf(c).length>1),products().map(c=>c.n));
 freshVisit();setTemplate('rect',[450,380]);S.items=[{id:80,k:K.bed,x:225,y:150,rot:0}];S.sel=80;goStep(2);await wait(20);$('sizebtn').click();await wait(10);
 ok('sizes: panel lists every bed size plus Custom',visible('#sizebox')&&$('sizechips').children.length===sizesOf(cat(K.bed)).length+1);
 [...$('sizechips').children].find(b=>b.textContent.startsWith('Standard King'))?.click();await wait(10);
 ok('sizes: tapping Standard King switches to that product',S.items[0].k==='690.069.81'&&!S.items[0].size&&near(body(S.items[0]).x1-body(S.items[0]).x0,166,.01),S.items[0]);
 ok('sizes: quote uses the King price',/1 x MALM bed frame, Standard King: 179/.test(quoteText()),quoteText());
 $('szw').value='175';$('szw').dispatchEvent(new Event('input',{bubbles:true}));await wait(10);
 ok('sizes: typing a custom width',S.items[0].size.w===175&&S.items[0].size.name==='Custom size',S.items[0].size);
 S.unit='ftin';render();ok('sizes: panel follows the unit',/ft/.test($('szw').value)&&/ft \+ in/.test($('szwl').textContent),$('szw').value);S.unit='cm';render();
 const q1=quoteText();ok('sizes: quote marks a custom size price to confirm',/Standard King \(Custom size, 175 x 209 x 100 cm, price to confirm\)/.test(q1),q1);
 [...$('sizechips').children].find(b=>b.dataset.sz==='k:'+K.bed).click();await wait(10);
 ok('sizes: back to Standard Double',S.items[0].k===K.bed&&!S.items[0].size&&near(body(S.items[0]).x1-body(S.items[0]).x0,150,.01),S.items[0]);
 S.items=[{id:82,k:'992.407.89',x:225,y:150,rot:0}];S.sel=82;render();$('sizebtn').click();await wait(10);
 ok('sizes: one-size product offers catalog size and Custom',$('sizechips').children.length===2&&$('sizechips').children[0].dataset.sz==='cat');
 S.items=[];S.sel=null;render();
 // a narrow room where the usual bed cannot fit, but a smaller size of the same bed can
 setTemplate('rect',[140,300]);S.type='bedroom';render();renderSugg();
 const bedAlt=suggList.find(x=>x.c.g==='malm');ok('sizes: a smaller bed size is suggested when the usual one does not fit',!!bedAlt&&!!bedAlt.from&&bedAlt.c.k==='490.099.47',bedAlt&&bedAlt.c.n);
 if(bedAlt){$('sugg').querySelector(`[data-add="${suggList.indexOf(bedAlt)}"]`).click();await wait(10);
  ok('sizes: Add places the smaller bed and it really fits',S.items.length===1&&S.items[0].k==='490.099.47'&&!issues().filter(m=>!m.includes('Verify access')).length,issues())}
 S.items=[];S.type='living';goStep(1);

 // ---- wall finishes ----
 freshVisit();setTemplate('rect',[450,380]);goStep(2);
 $('finbtn').click();ok('finish: Wall finish asks to tap a wall',visible('#finbar')&&finPick);
 {plan.scrollIntoView({block:'center'});const q=plan.createSVGPoint();q.x=225;q.y=4;const p=q.matrixTransform(plan.getScreenCTM());plan.dispatchEvent(new PointerEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:31}));plan.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:31}))}
 const F0=S.finishes[0];ok('finish: tapping the top wall opens its finish',!!F0&&F0.wall==='0'&&visible('#finbox')&&!finPick,S.finishes);
 [...$('finchips').querySelectorAll('[data-fk]')].find(b=>b.dataset.fk==='WP-FL-OAK').click();
 ok('finish: fluted panels on the whole wall, door taken off: 25 panels',finCalc(F0).q===25&&finCalc(F0).cost===450,finCalc(F0));
 $('fincov').querySelector('[data-cov=part]').click();{const tIn=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))};tIn($('finfrom'),'100');tIn($('finto'),'300')}$('fincov').querySelector('[data-cov=half]').click();
 ok('finish: part of the wall at half height: 6 panels',F0.part&&F0.half&&finCalc(F0).q===6,finCalc(F0));
 $('findone').click();S.finishes.push({id:S.next++,wall:'1',k:'WPP-LIN',part:false,from:0,to:380,half:false},{id:S.next++,wall:'2',k:'GEN-PAINT',col:'#f2efe9',part:false,from:0,to:450,half:false});render();
 ok('finish: wallpaper on a 380 cm wall: 3 rolls',finCalc(S.finishes[1]).q===3,finCalc(S.finishes[1]));
 ok('finish: paint on a 450 cm wall: 1 tin',finCalc(S.finishes[2]).q===1,finCalc(S.finishes[2]));
 {const qt=quoteText();ok('finish: the quote lists each finished wall',/Wall 1: 6 panels Fluted panel, oak look/.test(qt)&&/Wall 2: 3 rolls Wallpaper/.test(qt)&&/Not supplied \(layout only\): Wall 3: 1 tin of paint \(White\)/.test(qt)&&qt.includes('Total: 183'),qt)}
 ok('finish: the plan shows the finished walls',(plan.innerHTML.match(/stroke="#(b98a5e|d6cbb9|f2efe9)"/g)||[]).length===3);
 {const RMf=roomModel();ok('finish: the 3D model gets each finish on the right wall',RMf.finishes.length===3&&RMf.finishes[0].edge===0&&RMf.finishes[0].t0===100&&RMf.finishes[0].t1===300&&RMf.finishes[0].y1===120,RMf.finishes)}
 stash();ok('finish: finishes are saved with the room',(S.rooms[S.cur].finishes||[]).length===3);

 // ---- 3D view (needs an internet connection: three.js comes from a CDN) ----
 // room model handed to the 3D view: door and windows land on the right outline edges
 freshVisit();setTemplate('L-br',[450,230,200,150,250,380]);S.dwall='2';S.doff=50;S.obs=[{id:930,kind:'window',wall:0,off:120,w:160,sill:90}];render();
 let RM=roomModel();
 ok('3D model: door on the inner wall of an L',RM.door&&RM.loop[RM.door.edge].x===450&&RM.loop[RM.door.edge].y===230&&RM.door.t0===50&&RM.door.t1===140,RM.door);
 ok('3D model: window from sill to 210 cm on wall 1',RM.openings.some(o=>o.kind==='window'&&o.edge===0&&o.t0===120&&o.t1===280&&o.y0===90&&o.y1===210));
 freshVisit({mode:'rect',shape:'rect',rw:420,rl:360,dwall:'S',doff:60});S.walls=[];S.obs=[{id:931,kind:'window',wall:'W',off:100,w:120,sill:90}];render();RM=roomModel();
 ok('3D model: quick rectangle door on the bottom wall',RM.door&&RM.door.edge===2&&near(RM.door.t0,420-60-90,.01)&&near(RM.door.t1,420-60,.01),RM.door);
 ok('3D model: quick rectangle window on the left wall',RM.openings.some(o=>o.kind==='window'&&o.edge===3&&near(o.t0,360-100-120,.01)));
 // every product, plus a turned and a custom-sized piece, measured in the 3D scene
 freshVisit();setTemplate('rect',[1400,1100]);S.type='other';
 SAMPLE.forEach(c=>{const sp=findSpot(c,c.cl)||findSpot(c,0);if(sp)S.items.push({id:S.next++,k:c.k,x:sp.x,y:sp.y,rot:sp.rot})});
 const custom={id:S.next++,k:SAMPLE.find(c=>/Double/.test(c.n)).k,x:700,y:600,rot:90,size:{w:175,d:215,h:110,name:'Custom size'}};S.items.push(custom);render();
 let opened=false;try{await open3d();for(let i=0;i<40&&!view3d;i++)await wait(100);opened=!!view3d}catch(e){}
 ok('3D: view opens (needs internet the first time)',opened,$('v3dmsg').textContent);
 if(opened){
  ok('3D: one model per placed piece',view3d.pieces.length===S.items.length,[view3d.pieces.length,S.items.length]);
  ok('3D: lit by the real light file (studio HDR)',!!view3d.scene.environment&&view3d.scene.environment.isDataTexture);
  {let url='';try{url=await view3d.photo(null,{samples:1,maxMs:3000})}catch(e){url='ERR '+e.message}ok('3D: Photo makes a picture',/^data:image\/jpeg/.test(url),url.slice(0,60))}
  const tf=(e,x,y,z)=>[e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]];const off=[];
  for(const g of view3d.pieces){const pl=S.items.find(i=>i.id===g.userData.item.id),bd=body(pl),c=spec(pl);g.updateMatrixWorld(true);const mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];
   g.traverse(o=>{if(!o.isMesh||(o.geometry.type==='PlaneGeometry'&&o.material.transparent))return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox,e=o.matrixWorld.elements;
    for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=tf(e,x,y,z);for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],p[k]);mx[k]=Math.max(mx[k],p[k])}}});
   const err=Math.max(Math.abs(mn[0]*100-bd.x0),Math.abs(mx[0]*100-bd.x1),Math.abs(mn[2]*100-bd.y0),Math.abs(mx[2]*100-bd.y1),Math.abs(mx[1]*100-c.h),Math.abs(mn[1]*100));
   if(err>.2)off.push(`${c.n}${pl.size?' (custom)':''}: ${Math.round(err*10)/10} cm`)}
  ok('3D: every piece matches its plan footprint and catalog height within 2 mm',!off.length,off);
  const canv=()=>$('v3dcanvas').querySelectorAll('canvas').length;
  for(let i=0;i<3;i++){close3d();await open3d();for(let j=0;j<40&&!view3d;j++)await wait(100)}
  ok('3D: reopening leaves a single canvas',canv()===1,canv());
  close3d();ok('3D: closing removes the canvas and hides the viewer',canv()===0&&$('v3dwrap').hidden);
  freshVisit();setTemplate('L-br',[450,230,200,150,250,380]);S.dwall='2';S.doff=50;render();await open3d();for(let j=0;j<40&&!view3d;j++)await wait(100);
  view3d.setView('eye');view3d.render();const cam=view3d.camera.position;
  ok('3D: zoom goes where you point and can get close',view3d.controls.zoomToCursor&&view3d.controls.minDistance<=.1&&view3d.controls.maxDistance>=8);
  ok('3D: "from the door" camera stands inside the room at eye height',insideAt(cam.x*100,cam.z*100)&&near(cam.y,1.6,.01),[cam.x,cam.y,cam.z]);
  close3d()}
 S.mode='walls';S.shape='rect';S.sketch=null;S.walls=[];S.closed=false;fixRoom();render();await open3d();
 ok('3D: refuses a room whose walls are not finished',!view3d&&$('v3dwrap').hidden&&/not closed/.test($('tipmsg').textContent));
 freshVisit();

 // ---- three screens: Measure, Furniture, Quote ----
 freshVisit({doorSet:false,name:'Living room'});goStep(1);
 ok('screens: three screens',$('stepnav').children.length===3&&$('stepttl').textContent==='Measure the room',$('stepnav').textContent);
 ok('screens: Measure shows room type and size, not the plan or suggestions',visible('#typechips')&&visible('#wallsbox')&&!visible('#layoutcard')&&!visible('#sugg'));   // an <svg> has no offsetParent, so check its card
 ok('screens: a rectangle asks only Length and Width',!!$('tw0')&&!!$('tw1')&&!$('tw2')&&!visible('#shapes')&&visible('#notrect'));
 ok('screens: advanced controls hidden by default',!visible('#modewalls')&&!visible('#setcard')&&!visible('#unit'));
 $('gear').click();ok('screens: the settings icon shows the advanced controls',S.more&&visible('#modewalls')&&visible('#setcard')&&visible('#unit'));$('gear').click();
 const typeIn=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))};
 typeIn($('tw0'),'');typeIn($('tw1'),'');window.scrollTo(0,99999);const y0=$('tw0').getBoundingClientRect().top;
 typeIn($('tw0'),'450');typeIn($('tw1'),'380');ok('screens: Next unlocks once the size is typed',S.closed&&!$('next').disabled);
 ok('screens: the size boxes do not jump when the room becomes measured',Math.abs($('tw0').getBoundingClientRect().top-y0)<1,[y0,$('tw0').getBoundingClientRect().top]);window.scrollTo(0,0);
 // unit slips: 400 typed in metres, 4 typed in cm. The box turns red with a hint, the room is not accepted, nothing freezes.
 ok('size: the unit shows next to Size',visible('#unit2')&&$('unit2').value===S.unit);
 S.unit='m';load();render();typeIn($('tw0'),'400');typeIn($('tw1'),'3.8');
 ok('size: 400 in metres is refused with a hint',!S.closed&&$('tw0').classList.contains('bad')&&/Did you mean 400 cm/.test($('wallstat').textContent)&&$('next').disabled,$('wallstat').textContent);
 S.unit='cm';load();render();typeIn($('tw0'),'400');typeIn($('tw1'),'4');
 ok('size: 4 cm for a room side is refused with a hint',!S.closed&&$('tw1').classList.contains('bad')&&/Did you mean 4 m/.test($('wallstat').textContent));
 typeIn($('tw1'),'380');ok('size: correcting the number accepts the room',S.closed&&!$('tw1').classList.contains('bad')&&!$('next').disabled);
 typeIn($('tw0'),'450');
 $('typechips').querySelector('[data-t=bedroom]').click();ok('screens: the room type names the room',S.name==='Bedroom',S.name);
 $('notrect').click();ok('screens: "Not a rectangle? Draw it" offers the drawing board and the shape pictures',S.shape==='sketch'&&!!$('redraw')&&visible('#shapes'));
 $('shapes').querySelector('[data-shape=rect]').click();typeIn($('tw0'),'450');typeIn($('tw1'),'380');
 $('next').click();await wait(20);
 ok('screens: Furniture asks once where the door is',S.step===2&&visible('#doorbar')&&document.body.classList.contains('doormode')&&!visible('#movedoor'));
 {const q=plan.createSVGPoint();q.x=200;q.y=378;const p=q.matrixTransform(plan.getScreenCTM());plan.dispatchEvent(new PointerEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:9}));plan.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9}))}
 ok('screens: tapping the plan places the door and stops asking',S.doorSet&&S.dwall==='2'&&!visible('#doorbar')&&visible('#movedoor'),[S.dwall,S.doff]);
 // while the door prompt shows, tapping a piece selects it and leaves the door alone
 {renderSugg();$('sugg').querySelector('[data-add]').click();const pc=S.items[S.items.length-1];S.sel=null;moveDoor=true;render();const d0=[S.dwall,S.doff];
  plan.querySelector(`[data-id="${pc.id}"]`).scrollIntoView({block:'center'});const q=plan.createSVGPoint();q.x=pc.x;q.y=pc.y;const p=q.matrixTransform(plan.getScreenCTM());document.elementFromPoint(p.x,p.y).dispatchEvent(new PointerEvent('pointerdown',{clientX:p.x,clientY:p.y,bubbles:true,pointerId:11}));plan.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:11}));
  ok('door prompt: tapping a piece selects it and does not move the door',S.sel===pc.id&&S.dwall===d0[0]&&S.doff===d0[1]&&visible('#doorbar'),[S.sel,pc.id,d0,S.dwall,S.doff]);
  $('doorskip').click();S.items=S.items.filter(i=>i.id!==pc.id);S.sel=null;render()}
 $('movedoor').click();ok('screens: Move door asks again; Cancel keeps the door',visible('#doorbar')&&($('doorskip').click(),!visible('#doorbar')&&S.dwall==='2'));
 ok('screens: Furniture shows the plan, the 3D button and the fits-here list, not the fit-check list',visible('#layoutcard')&&visible('#v3d')&&visible('#sugg')&&!visible('#issues'));
 // ---- one workspace: the house fills the screen, the catalogue is a drawer, the total stays on top ----
 {renderSugg();const rb=e=>$(e).getBoundingClientRect(),wide=innerWidth>=900;
  ok('workspace: the page itself does not scroll on Furniture',document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth+1,[document.documentElement.scrollHeight,innerHeight]);
  ok('workspace: catalogue cards show each piece drawn from above',$('sugg').querySelectorAll('.sg .th').length>=5);
  ok('workspace: the total and a Quote button stay on top',visible('#totpill')&&/Quote/.test($('totpill').textContent));
  if(wide){ok('workspace: wide screen puts the catalogue beside the plan',rb('drawer').left>=rb('layoutcard').right-1&&rb('drawer').top<rb('layoutcard').bottom,[rb('drawer').left,rb('layoutcard').right]);
   const w0=rb('layoutcard').width;$('drawhide').click();await wait(20);
   ok('workspace: Hide gives the plan the whole width and shows a Catalogue button',!visible('#drawer')&&rb('layoutcard').width>w0+100&&visible('#drawopen'));
   $('drawopen').click();await wait(20);ok('workspace: Catalogue brings the drawer back',visible('#drawer')&&!visible('#drawopen'))}
  else{ok('workspace: narrow screen puts the catalogue under the plan',rb('drawer').top>=rb('layoutcard').bottom-1)}
  const st0=S.step;$('totpill').click();await wait(10);ok('workspace: tapping the total opens the quote',S.step===3);goStep(st0);await wait(10)}
 const nAdd=$('sugg').querySelectorAll('[data-add]').length;$('sugg').querySelector('[data-add]').click();await wait(10);
 ok('screens: + adds a piece and shows Turn, Size and Remove',nAdd>0&&S.items.length===1&&visible('#rot')&&visible('#sizebtn')&&visible('#del')&&!visible('#sizebox'));
 const p0=S.items[0];S.items.push({id:S.next++,k:K.coffee,x:p0.x,y:p0.y,rot:0});S.sel=null;render();
 const strokeOf=id=>plan.querySelector(`[data-id="${id}"] > rect`).getAttribute('stroke');
 ok('screens: a problem turns the pieces red with one short line',strokeOf(p0.id)==='var(--err)'&&strokeOf(S.items[1].id)==='var(--err)'&&visible('#probline')&&/overlaps/.test($('probline').textContent),$('probline').textContent);
 S.items.pop();render();ok('screens: no problem, no red',strokeOf(p0.id)==='var(--accent)'&&!visible('#probline'));
 // zoom: pinch with two fingers keeps the spot under the fingers; one finger on empty floor moves; Fit shows the whole room
 {const r=plan.getBoundingClientRect(),cx=r.left+r.width*.3,cy=r.top+r.height*.6,ev=(ty,id,x,y)=>plan.dispatchEvent(new PointerEvent(ty,{pointerId:id,clientX:x,clientY:y,bubbles:true}));
  const P0=pt({clientX:cx,clientY:cy});ev('pointerdown',21,cx-30,cy);ev('pointerdown',22,cx+30,cy);ev('pointermove',21,cx-90,cy);ev('pointermove',22,cx+90,cy);const P1=pt({clientX:cx,clientY:cy});ev('pointerup',21,0,0);ev('pointerup',22,0,0);
  ok('zoom: pinching zooms the plan around the fingers',near(pv.z,3,.01)&&near(P0.x,P1.x,.5)&&near(P0.y,P1.y,.5)&&visible('#fit'),[pv.z,P0,P1]);
  const vb0=plan.getAttribute('viewBox');ev('pointerdown',23,cx,cy);ev('pointermove',23,cx+40,cy+20);ev('pointerup',23,0,0);
  ok('zoom: one finger on empty floor moves the zoomed plan',plan.getAttribute('viewBox')!==vb0&&S.items.length===1);
  $('fit').click();const F=planFull();ok('zoom: Fit shows the whole room again',pv.z===1&&plan.getAttribute('viewBox')===`${F.x} ${F.y} ${F.w} ${F.h}`&&!visible('#fit'))}
 $('next').click();await wait(10);const tot=groupItems().reduce((a,{c,q})=>a+c.p*q,0);
 ok('screens: Quote shows one big total and one line per room',S.step===3&&$('qtotal').textContent===tot.toLocaleString()&&$('qrooms').children.length===1&&!visible('#next')&&visible('#copyq'),[$('qtotal').textContent,tot]);
 $('qaddroom').click();await wait(10);ok('screens: + Room adds a room and opens Measure',S.rooms.length===2&&S.cur===1&&S.step===1);
 $('typechips').querySelector('[data-t=bedroom]').click();ok('screens: a second bedroom is named Bedroom 2',S.name==='Bedroom 2',S.name);
 goStep(3);$('qrooms').querySelector('[data-qr="0"]').click();await wait(10);ok('screens: tapping a room line opens that room',S.cur===0&&S.step===2&&S.items.length===1);
 S.step=5;render();ok('screens: an old saved step number lands on a real screen',S.step===3);goStep(1);
 // review 2026-10-24: main piece first, beds centred, bedside tables beside the bed, readable labels, client-ready quote text
 freshVisit({type:'bedroom',name:'Bedroom',dwall:'2',doff:300});setTemplate('rect',[420,380]);goStep(2);renderSugg();
 ok('review: in a bedroom the bed comes first',typeOf(suggList[0].c)==='bed',suggList.slice(0,3).map(x=>x.c.n));
 const addK=k=>{renderSugg();const i=suggList.findIndex(x=>x.c.k===k||x.c.g===k);$('sugg').querySelector(`[data-add="${i}"]`).click()};
 addK('malm');const bed0=S.items[0];ok('review: the bed is centred on its wall',near(bed0.x,210,1)&&near(body(bed0).y0,0,.5),[bed0.x,bed0.y]);
 addK('506.107.39');addK('506.107.39');const [l1,l2]=S.items.slice(1).map(body),bb=body(bed0);
 ok('review: bedside tables go either side of the bed head',[l1,l2].every(b=>near(b.y0,0,.5))&&[l1,l2].some(b=>near(b.x1,bb.x0,5))&&[l1,l2].some(b=>near(b.x0,bb.x1,5)),[l1,l2,bb]);
 S.sel=null;render();ok('review: plan labels use short names',/>MALM bed frame</.test($('plan').innerHTML)&&!/Standard Double</.test($('plan').innerHTML));
 ok('review: the copied quote has no internal notes',!/Note:/.test(quoteText()),quoteText());
 freshVisit({type:'living',name:'Living room',dwall:'2',doff:50});setTemplate('rect',[480,400]);goStep(2);renderSugg();
 ok('review: in a living room the sofa comes first',typeOf(suggList[0].c)==='sofa',suggList[0].c.n);
 addK('kivik');addK('lackcoffee');addK('lacktv');{const [so,ct,tv]=S.items,bs=body(so),bc=body(ct),bt=body(tv);
  ok('review: coffee table in front of the sofa, TV on the wall the sofa faces',near(bc.y0-bs.y1,45,3)&&near(bt.y1,400,.5)&&tv.rot===(so.rot+180)%360&&near(so.x,240,1),[bs,bc,bt,so.rot,tv.rot])}
 // more than one of a product, in the size the rep chooses
 freshVisit({type:'living',name:'Living room',dwall:'2',doff:50});setTemplate('rect',[600,450]);goStep(2);renderSugg();
 const sofaRow=()=>[...$('sugg').querySelectorAll('.sgm')].find(r=>/KIVIK sofa/.test(r.textContent));
 ok('choice: a product with sizes shows one button per size',!!sofaRow()&&sofaRow().querySelectorAll('.szb').length===2,sofaRow()&&sofaRow().textContent);
 const tap=lbl=>{renderSugg();[...sofaRow().querySelectorAll('.szb')].find(b=>b.textContent.includes(lbl)).click()};
 tap('3-seat');tap('3-seat');tap('2-seat');
 ok('choice: two 3-seat sofas and a 2-seat can be added',S.items.filter(i=>i.k==='694.405.96').length===2&&S.items.filter(i=>i.k==='294.405.98').length===1,S.items.map(i=>i.k));
 renderSugg();ok('choice: the sofa row stays in place after adding',!!sofaRow());
 freshVisit({type:'living',name:'Living room'});setTemplate('rect',[250,250]);goStep(2);renderSugg();
 const tight=$('sugg').querySelector('.sgtight');
 ok('choice: pieces that do not fit well are listed with an add button',!!tight&&!!tight.querySelector('[data-addk]')&&/Needs more space/.test($('sugg').textContent));
 if(tight){const n=S.items.length;tight.querySelector('[data-addk]').click();ok('choice: adding a tight piece places it and the plan shows the problem',S.items.length===n+1&&(problems().length>0||check().some(([t])=>t!=='ok')))}
 // any piece in any room: a sofa is right there in a bedroom's list, nothing folded away; filters and search
 freshVisit({type:'bedroom',name:'Bedroom'});setTemplate('rect',[450,400]);goStep(2);renderSugg();
 ok('choice: a bedroom lists sofas too, in the main list',/KIVIK sofa/.test($('sugg').textContent)&&!$('sugg').querySelector('details'));
 $('sgcats').querySelector('[data-cat=bed]').click();ok('choice: the Beds filter shows only beds',/MALM/.test($('sugg').textContent)&&!/KIVIK|BILLY|LACK/.test($('sugg').textContent),$('sugg').textContent.slice(0,120));
 $('sgcats').querySelector('[data-cat=all]').click();$('sgq').value='kivik';$('sgq').dispatchEvent(new Event('input'));
 ok('choice: search finds a product by name',/KIVIK/.test($('sugg').textContent)&&!/MALM/.test($('sugg').textContent));
 $('sgq').value='';$('sgq').dispatchEvent(new Event('input'));
 // typing a rectangle, then "Draw it", then drawing a rectangle keeps the typed size
 freshVisit();goStep(1);const typeIn2=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))};typeIn2($('tw0'),'430');typeIn2($('tw1'),'360');
 $('notrect').click();padStrokes=[[[20,20],[150,20],[280,20]],[[280,20],[280,100],[280,190]],[[280,190],[150,190],[20,190]],[[20,190],[20,100],[20,22]]];padFinish();
 ok('draw: a drawn rectangle keeps the typed length and width',S.walls.length===4&&S.walls[0].len===430&&S.walls[1].len===360&&S.closed,S.walls.map(w=>w.len));
 goStep(1);
 {const qt=quoteText();ok('quote text: no empty client/rep and no repeated room name',/^Quote, /.test(qt)&&!/\(rep: -\)/.test(qt)&&!/Living room \(Living room\)/.test(qt),qt.split('\n').slice(0,3))}
 S.doorSet=true;goStep(1);$('notrect').click();$('shapes').querySelector('[data-shape=rect]').click();ok('door prompt: a new room shape asks for the door again',S.doorSet===false);

 // ---- company pack: the sample zip with furniture, a textured panel and wallpaper, and two doors ----
 {let p=null;try{p=await readPack(new File([await (await fetch('samples/sample-company-pack.zip')).blob()],'sample-company-pack.zip'))}catch(e){ok('pack: the sample pack can be read',false,e.message)}
  if(p){const r=buildCatalog(p.csv,Object.keys(p.files));
   ok('pack: the sample pack has no errors',!r.errs.length,r.errs);
   ok('pack: furniture, finishes and doors are read',r.out.length===5&&r.fin.length===2&&r.doors.length===2,[r.out.length,r.fin.length,r.doors.length]);
   applyPack(p);setCatalog(r.out,false,true);
   ok('pack: the company name, doors and finishes are in use',COMPANY==='Demo Furniture Co (sample)'&&CO_DOORS.length===2&&CO_FIN.length===2&&!CO_FIN.some(f=>f.k==='WPP-LIN'),COMPANY);
   ok('pack: its photos are served from the device',/^blob:/.test(assetUrl('oak.jpg'))&&/^blob:/.test(assetUrl('trellis.png'))&&assetUrl('missing.jpg')==='');
   ok('pack: the catalog is the company furniture plus generic pieces',cat('DF-SOFA3')&&cat('GEN-SOFA3')&&!cat(K.bed),CATALOG.length);
   ok('pack: a wrong file name is rejected',buildCatalog(p.csv.replace('trellis.png','nope.png'),Object.keys(p.files)).errs.some(e=>/nope\.png/.test(e)));
   freshVisit({keepCatalog:true});setTemplate('rect',[450,380]);
   S.doorK='DF-DR-OAK';S.items.push({id:S.next++,k:'DF-BED',x:100,y:20,rot:0},{id:S.next++,k:'GEN-ARM',x:20,y:250,rot:0,col:'#7a8f9e'});
   S.finishes.push({id:S.next++,wall:'1',k:'DF-PNL-OAK',part:false,from:0,to:380,half:false},{id:S.next++,wall:'3',k:'DF-WP-TREL',part:false,from:0,to:380,half:false});render();
   const q=quoteLines(),qt=quoteText();
   ok('pack: the chosen door is priced in the quote',q.priced.some(x=>x.label==='Door: Oak veneer door'&&x.cost===450),q.priced.map(x=>x.label));
   ok('pack: panels and wallpaper are priced in the quote',q.priced.some(x=>/Oak veneer wall panel/.test(x.label))&&q.priced.some(x=>/Trellis wallpaper/.test(x.label)));
   ok('pack: a generic piece is listed as not supplied, with its colour',q.gen.some(x=>/armchair/.test(x))&&/Not supplied \(layout only\)/.test(qt)&&!q.priced.some(x=>/Armchair/.test(x.label)),q.gen);
   const M=roomModel(),bed=M.items.find(i=>i.name==='Oak bed 160x200'),arm=M.items.find(i=>i.name==='Armchair');
   ok('pack: 3D gets the door style and photo',M.door&&M.door.style==='flat'&&/^blob:/.test(M.door.tex),M.door);
   ok('pack: 3D gets the panel and wallpaper photos at their real size',M.finishes.length===2&&M.finishes.every(f=>/^blob:/.test(f.tex))&&M.finishes.some(f=>f.th===53),M.finishes.map(f=>[f.tex.slice(0,5),f.tw,f.th]));
   ok('pack: 3D gets the furniture photo and the generic colour',/^blob:/.test(bed.tex)&&arm.color==='#7a8f9e'&&!arm.tex,[bed.tex,arm.color]);
   S.doorK='DF-DR-GEO';ok('pack: a style door without a photo',roomModel().door.style==='geometric'&&!roomModel().door.tex);
   S.doorK='';S.doorCol='#334455';ok('pack: the plain door takes the chosen colour and is not priced',roomModel().door.col==='#334455'&&!quoteLines().priced.some(x=>/^Door/.test(x.label)));
  }
  applyPack(null);setCatalog(SAMPLE.slice(),true);
  ok('pack: going back to the samples',COMPANY==='Sample company'&&CO_FIN.some(f=>f.k==='WPP-LIN')&&cat(K.bed)&&assetUrl('oak.jpg')==='')}

 // ---- sets and estimated sizes (made-up mini catalogue, no store data) ----
 {const H='kind,sku,name,width_cm,depth_cm,height_cm,front_clearance_cm,price,type,rooms,photo,estimated,pieces';
  const csv=[H,'furniture,T-S3,Test 3-seater sofa,220,95,90,45,,sofa,living,,yes,','furniture,T-ARM,Test armchair,100,90,90,50,,chair,living,,yes,',
   'furniture,T-CT,Test centre table,120,65,45,35,,table,living,,yes,','furniture,T-DT,Test dining table (6 seats),180,95,76,0,,table,dining,,yes,',
   'furniture,T-DC,Test dining chair,50,58,100,0,,chair,dining,,yes,','furniture,T-TV,Test TV stand,200,45,55,60,1500,storage,living,,yes,',
   'set,T-SOFASET,Test Sofa Set,,,,,7000,,living,,,T-S3*2|T-ARM*2|T-CT*1','set,T-DINSET,Test Dining Set,,,,,5000,,dining,,,T-DT*1|T-DC*6'].join('\n');
  const r=buildCatalog(csv);ok('sets: a catalog with sets and estimated sizes is read',!r.errs.length&&r.sets.length===2&&r.out.find(c=>c.k==='T-S3').part&&!r.out.find(c=>c.k==='T-TV').part&&r.out.every(c=>c.est),r.errs);
  ok('sets: a set naming a missing piece is refused',buildCatalog(H+'\nset,T-BAD,Bad set,,,,,1,,,,,NOPE*1').errs.some(e=>/NOPE/.test(e)));
  CO_SETS=r.sets;setCatalog(r.out,false);freshVisit({type:'living',name:'Living room',dwall:'2',doff:60,keepCatalog:true});setTemplate('rect',[600,480]);goStep(2);renderSugg();await wait(10);
  ok('sets: pieces sold only in a set are not listed alone',!products().some(c=>c.k==='T-S3')&&products().some(c=>c.k==='T-TV'));
  ok('sets: the catalogue shows the set card and a size-to-confirm mark',!!$('sugg').querySelector('[data-set="T-SOFASET"]')&&/size to confirm/.test($('sugg').textContent));
  $('sugg').querySelector('[data-set="T-SOFASET"]').click();await wait(10);
  const g=new Set(S.items.map(i=>i.set&&i.set.g));
  ok('sets: adding a set places all its pieces as one set',S.items.length===5&&g.size===1&&!g.has(undefined)&&!problems().length,S.items.map(i=>i.k));
  let Q=quoteLines();ok('sets: the quote has one line at the set price, sizes to confirm',Q.priced.length===1&&Q.priced[0].cost===7000&&/sizes to confirm/.test(Q.priced[0].sub),Q.priced);
  S.items.pop();render();Q=quoteLines();ok('sets: removing a piece keeps the set price and says what is placed',Q.priced[0].cost===7000&&/4 of 5 pieces/.test(Q.priced[0].sub),Q.priced[0].sub);
  freshVisit({type:'dining',name:'Dining room',dwall:'2',doff:60,keepCatalog:true});setTemplate('rect',[520,420]);goStep(2);placeSet(CO_SETS[1]);
  const T=S.items.find(i=>i.k==='T-DT'),tb=body(T),ch=S.items.filter(i=>i.k==='T-DC').map(body);
  const touches=b=>Math.max(tb.x0-b.x1,b.x0-tb.x1,tb.y0-b.y1,b.y0-tb.y1)<=4;
  ok('sets: the dining table stands free, away from the walls',tb.x0>=50&&tb.y0>=50&&tb.x1<=S.rw-50&&tb.y1<=S.rl-50,tb);
  ok('sets: all six chairs sit at the table',ch.length===6&&ch.every(touches)&&!problems().length,ch);
  CO_SETS=[];setCatalog(SAMPLE.slice(),true)}

 // ---- drawing board: free drawing with straightened walls, a whole house or one room at a time ----
 {const D=await import(new URL('../drawplan.js?v='+DPV,import.meta.url).href);drawMod=drawMod||D;
  let sd=5;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647-.5};
  const mk=pts=>{const P=[];for(let i=0;i+1<pts.length;i++){const a=pts[i],b=pts[i+1],n=Math.max(10,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/10));
   for(let k=0;k<n;k++){const t=k/n;P.push([a[0]+(b[0]-a[0])*t+rr()*8,a[1]+(b[1]-a[1])*t+rr()*8])}}P.push(pts[pts.length-1]);return P};
  const wl=r=>r.walls.map(w=>w.len+w.turn+(w.curve?'~'+w.curve.side:'')).join(',');
  const loose=p=>{const t=D.tidy(p),deg={};t.e.forEach(e=>{deg[e.a]=(deg[e.a]||0)+1;deg[e.b]=(deg[e.b]||0)+1});return Object.values(deg).filter(v=>v<2).length};
  let p=D.newPlan();D.addStroke(p,mk([[0,0],[1200,0],[1200,800],[0,800],[0,0]]),40);
  ok('board: a wobbly outline comes out straight, at its drawn size',D.rooms(p).length===1&&wl(D.rooms(p)[0])==='1200R,800R,1200R,800R',D.rooms(p).map(wl));
  [[[500,-10],[500,830]],[[1210,400],[490,400]],[[-10,450],[500,450]]].forEach(s=>D.addStroke(p,mk(s),40));
  let R2=D.rooms(p);
  ok('board: inside walls drawn across the house make 4 rooms, with no loose ends',R2.length===4&&!loose(p)&&near(R2.reduce((a,r)=>a+r.area,0),1200*800,1),R2.map(wl));
  ok('board: an inside wall that ends on a wall stays straight',R2.every(r=>r.walls.every(w=>/R$|L$/.test(w.turn))&&r.walls.length===4),R2.map(wl));
  const top=p.e.findIndex(e=>e&&p.v[e.a].y===0&&p.v[e.b].y===0&&Math.min(p.v[e.a].x,p.v[e.b].x)===0);
  D.setLength(p,top,520);R2=D.rooms(p);
  ok('board: typing a wall length moves the walls beyond it, so shared walls stay joined',R2.length===4&&R2.filter(r=>r.walls[0].len===520).length===2&&!loose(p)&&near(Math.max(...p.v.filter(Boolean).map(v=>v.x)),1220,.5),R2.map(wl));
  let q=D.newPlan();[[[0,0],[500,0],[500,250],[300,250]],[[300,250],[300,400],[0,400],[0,0]]].forEach(s=>D.addStroke(q,mk(s),30));
  ok('board: a room drawn in two strokes joins up (L-shape)',D.rooms(q).length===1&&wl(D.rooms(q)[0])==='500R,250R,200L,150R,300R,400R',D.rooms(q).map(wl));
  q=D.newPlan();D.addStroke(q,mk([[0,0],[200,-80],[400,-100],[600,-80],[800,0],[800,400],[0,400],[0,0]]),30);
  ok('board: a curved wall becomes a curve',D.rooms(q).length===1&&D.rooms(q)[0].walls.filter(w=>w.curve&&w.curve.side==='out').length===1,D.rooms(q).map(wl));
  q=D.newPlan();D.addStroke(q,mk([[0,0],[500,0],[500,250],[350,400],[0,400],[0,0]]),30);
  ok('board: a cut corner becomes a 45-degree wall',D.rooms(q).length===1&&D.rooms(q)[0].walls.filter(w=>w.turn==='R45').length===2,D.rooms(q).map(wl));
  ok('board: a fully round room is refused with a reason',D.readStroke(mk(Array.from({length:41},(_,i)=>[300+200*Math.cos(i*Math.PI/20),300+200*Math.sin(i*Math.PI/20)]))).err==='round');
  // into the app: the house becomes the visit's rooms; redrawing keeps names and furniture
  freshVisit();goStep(1);
  boardDone({mode:'house',plan:D.tidy(p),rooms:D.rooms(D.tidy(p))});
  ok('board: Make rooms turns every enclosed area into a measured room',S.rooms.length===4&&S.rooms.every(r=>r.closed&&r.mode==='walls'&&r.shape==='sketch'&&r.hk)&&!!S.house&&S.cur===0,S.rooms.map(r=>[r.name,r.closed,r.rw,r.rl]));
  ok('board: the first room reuses the empty room the visit started with',S.rooms[0].name==='Room 1');
  ok('board: the room list shows every room on the Room card',$('rooms2').querySelectorAll('[data-r]').length===4&&!$('rooms2').hidden);
  $('typechips').querySelector('[data-t=bedroom]').click();S.items.push({id:S.next++,k:K.bed,x:S.rw/2,y:110,rot:0});render();stash();
  const p2=JSON.parse(JSON.stringify(S.house));D.addStroke(p2,mk([[870,-10],[870,410]]),40);
  boardDone({mode:'house',plan:D.tidy(p2),rooms:D.rooms(D.tidy(p2))});
  const bed=S.rooms.find(r=>r.name==='Bedroom');
  ok('board: drawing one more wall adds a room and keeps the others (names, furniture)',S.rooms.length===5&&!!bed&&bed.items.length===1,S.rooms.map(r=>r.name));
  freshVisit();goStep(1);const qq=D.newPlan();D.addStroke(qq,mk([[0,0],[500,0],[500,250],[300,250],[300,400],[0,400],[0,0]]),30);
  boardDone({mode:'room',plan:D.tidy(qq),rooms:D.rooms(D.tidy(qq))});
  ok('board: This room uses the drawing for the open room only',S.rooms.length===1&&S.shape==='sketch'&&S.closed&&S.walls.length===6&&near(S.rw,500,1)&&near(S.rl,400,1)&&!!S.plan,[S.walls.map(w=>w.len),S.rw,S.rl]);
  {goStep(2);const c=CATALOG.find(c=>!c.gen&&c.w<=80&&c.d<=80),it={id:S.next++,k:c.k,x:430,y:340,rot:0};S.items.push(it);render();
   ok('keep in: a piece put in the missing corner of an L-shaped room moves back inside',rectInRoom(body(it))&&(it.x<=300-c.w/2+1||it.y<=250-c.d/2+1),[it.x,it.y]);
   S.items=[];render();goStep(1)}
  $('drawhouse').click();for(let i=0;i<40&&!document.querySelector('.dp');i++)await wait(50);await wait(100);
  {const m=S.mode;S.mode='rect';render();ok('board: the Draw buttons also show in Quick rectangle mode',!!$('drawroom').offsetParent&&!!$('drawhouse').offsetParent);S.mode=m;render()}
  ok('board: Draw the whole house opens the board in house mode',!!document.querySelector('.dp')&&document.querySelector('.dp [data-m=house]').classList.contains('on'));
  document.querySelector('.dp [data-a=cancel]').click();ok('board: Cancel closes it and keeps the room',!document.querySelector('.dp')&&S.closed);
  freshVisit()}
 // ---- View: the store photo large, and the piece's 3D model on its own ----
 {const H='kind,sku,name,width_cm,depth_cm,height_cm,front_clearance_cm,price,type,rooms,estimated,pieces',PX='data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
  const r=buildCatalog([H,'furniture,V-S3,View sofa,220,90,90,60,,sofa,living,,','furniture,V-ARM,View armchair,80,80,95,60,,chair,living,,','furniture,V-TV,View TV stand,200,45,55,60,1500,storage,living,,',
   'set,V-SET,View Sofa Set,,,,,7000,,living,,V-S3*1|V-ARM*2'].join('\n'));
  r.sets[0].ph=PX;r.out.find(c=>c.k==='V-TV').ph=PX;
  CO_SETS=r.sets;setCatalog(r.out,false);freshVisit({type:'living',name:'Living room',dwall:'2',doff:60,keepCatalog:true});setTemplate('rect',[600,480]);goStep(2);renderSugg();await wait(10);
  const vs=$('sugg').querySelector('[data-vset="V-SET"]'),vp=$('sugg').querySelector('[data-view="V-TV"]');
  ok('view: set and piece cards with a photo have a View button',!!vs&&!!vp);
  vs.click();await wait(10);
  ok('view: View opens the photo and does not add the set',!$('pview').hidden&&$('pvimg').src===PX&&!S.items.length&&$('pvttl').textContent==='View Sofa Set');
  ok('view: it lists the pieces, sizes to confirm and the set price',/View sofa/.test($('pvinfo').textContent)&&/7,000|7000/.test($('pvinfo').textContent));
  ok('view: View shows the photo only (no 3D in it)',!$('pview').querySelector('canvas')&&!$('pv3'));
  $('pvadd').click();await wait(10);
  ok('view: Add to room places the whole set and closes the view',$('pview').hidden&&S.items.length===3);
  vp.isConnected||renderSugg();await wait(10);$('sugg').querySelector('[data-view="V-TV"]').click();await wait(10);
  ok('view: a single piece shows its size and price',/200 x 45 x 55|200 × 45 × 55/.test($('pvinfo').textContent)&&/1,500|1500/.test($('pvinfo').textContent),$('pvinfo').textContent);
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));ok('view: Escape closes it',$('pview').hidden&&S.items.length===3);
  freshVisit()}
 // ---- Keep in: no piece is left outside the room ----
 {freshVisit({type:'living',name:'Living room',dwall:'2',doff:60,keepCatalog:true});setTemplate('rect',[400,300]);goStep(2);
  const c=CATALOG.find(c=>!c.gen&&c.w>=150&&c.w<=250&&c.d<=100),it=placePiece(c);S.sel=it.id;render();
  const g=()=>$('plan').querySelector(`[data-id="${it.id}"]`),b=g().getBoundingClientRect(),pr=$('plan').getBoundingClientRect();
  g().dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:b.x+b.width/2,clientY:b.y+b.height/2,pointerId:8}));
  $('plan').dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:pr.right+400,clientY:pr.bottom+400,pointerId:8}));
  $('plan').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:8}));
  ok('keep in: dragging a piece off the plan stops it at the walls',rectInRoom(body(it))&&near(body(it).x1,400,1)&&near(body(it).y1,300,1),[it.x,it.y]);
  it.rot=0;it.x=200;it.y=c.d/2;render();$('rot').click();ok('keep in: turning a piece against a wall keeps it inside',rectInRoom(body(it)),body(it));
  it.rot=0;it.x=400-c.w/2;it.y=150;render();S.walls[0].len=S.walls[2].len=300;onShapeChange(false);render();ok('keep in: making the room smaller pulls the piece in',rectInRoom(body(it)),body(it));
  S.sel=it.id;render();$('px').value='280';$('px').dispatchEvent(new Event('input'));ok('keep in: a typed position past the wall stops at the wall',rectInRoom(body(it))&&near(body(it).x1,300,1),body(it));
  S.walls[0].len=S.walls[2].len=S.walls[1].len=S.walls[3].len=120;onShapeChange(false);render();
  ok('keep in: a piece too big for the room stays put and is flagged',!rectInRoom(body(it))&&issues().some(m=>m.includes('sticks out')),issues());
  freshVisit()}

 // ---- Select: tick several pieces and remove them together ----
 {freshVisit({type:'living',name:'Living room',dwall:'2',doff:60,keepCatalog:true});setTemplate('rect',[600,480]);goStep(2);
  ok('select: no Select in an empty room',$('selbtn').hidden);
  CATALOG.filter(c=>!c.gen&&c.w<150).slice(0,4).forEach(c=>placePiece(c));S.sel=null;render();
  ok('select: Select shows once the room has two pieces',!$('selbtn').hidden&&S.items.length===4);
  const tap=id=>{const x=$('plan').querySelector(`[data-id="${id}"]`),r=x.getBoundingClientRect();x.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:r.x+r.width/2,clientY:r.y+r.height/2,pointerId:9}));$('plan').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9}))};
  $('selbtn').click();const ids=S.items.map(i=>i.id),before=S.items.map(i=>i.x+','+i.y).join();
  ok('select: Select mode swaps the tools for its bar',!$('pickbar').hidden&&$('plantools').hidden&&$('pickdel').disabled);
  tap(ids[0]);tap(ids[2]);
  ok('select: tapping pieces ticks them, and nothing moves',pick.size===2&&$('pickmsg').textContent==='2 selected'&&$('pickdel').textContent==='Remove 2'&&S.items.map(i=>i.x+','+i.y).join()===before);
  tap(ids[2]);ok('select: tapping a ticked piece unticks it',pick.size===1&&pick.has(ids[0]));
  $('pickall').click();ok('select: All ticks every piece',pick.size===4&&$('pickall').textContent==='None');
  $('pickall').click();ok('select: None clears the ticks',pick.size===0);
  tap(ids[1]);tap(ids[3]);$('pickdel').click();await wait(10);$('askyes').click();await wait(10);
  ok('select: Remove takes away the ticked pieces only, after asking',S.items.length===2&&S.items.every(i=>i.id===ids[0]||i.id===ids[2])&&!pick&&!$('plantools').hidden&&$('pickbar').hidden);
  $('selbtn').click();$('pickdone').click();ok('select: Done leaves without removing',S.items.length===2&&!pick);
  freshVisit()}

 // ---- Door and windows on the plan: slide along the walls, tap a distance to type it; tap a gap to move a piece ----
 {freshVisit({type:'living',name:'Living room',dwall:'0',doff:40,keepCatalog:true});setTemplate('rect',[450,380]);goStep(2);S.doorSet=true;render();
  const plan=$('plan'),scr=(x,y)=>{const q=plan.createSVGPoint();q.x=x;q.y=y;return q.matrixTransform(plan.getScreenCTM())},
   ev=(el,ty,p,id)=>el.dispatchEvent(new PointerEvent(ty,{bubbles:true,clientX:p.x,clientY:p.y,pointerId:id})),
   tapAt=(x,y,id)=>{plan.scrollIntoView({block:'center'});const p=scr(x,y);ev(document.elementFromPoint(p.x,p.y),'pointerdown',p,id);ev(plan,'pointerup',p,id)},
   pills=sel=>[...plan.querySelectorAll(sel)].map(g=>parseFloat(g.textContent));
  ok('openings: Add window shows on the plan tools',!$('addwin').hidden);
  $('addwin').click();ok('openings: Add window asks for a wall',!$('doorbar').hidden&&$('doormsg').textContent.includes('window'));
  tapAt(449,150,41);const w=S.obs[S.obs.length-1];
  ok('openings: a tap on the right wall puts a 120 cm window there, centred on the tap',S.obs.length===1&&w.kind==='window'&&w.wall===1&&near(w.off,90,1)&&opSel===w.id,S.obs);
  ok('openings: the picked window shows its bar and its distances to both corners',!$('opbar').hidden&&!$('oprm').hidden&&pills('[data-opgap]').length===2&&near(pills('[data-opgap]').reduce((a,b)=>a+b,0)+w.w,380,1),pills('[data-opgap]'));
  {const hit=plan.querySelector(`[data-op="${w.id}"]`),a=scr(449,150),b=scr(452,330);ev(hit,'pointerdown',a,42);ev(plan,'pointermove',b,42);ev(plan,'pointerup',b,42)}
  ok('openings: dragging the window slides it down its wall and snaps it into the corner',w.wall===1&&near(w.off,260,.1),w);
  {const hit=plan.querySelector('[data-op="door"]'),a=scr(85,0),b=scr(1,200);ev(hit,'pointerdown',a,43);ev(plan,'pointermove',b,43);ev(plan,'pointerup',b,43)}
  ok('openings: the door can be dragged onto another wall',S.dwall==='3'&&opSel==='door'&&$('oprm').hidden&&$('opsill').hidden,[S.dwall,S.doff]);
  {const gs=[...plan.querySelectorAll('[data-opgap]')],b=gs.find(g=>g.dataset.opgap==='b'),r=b.getBoundingClientRect();
   ev(b,'pointerdown',{x:r.x+r.width/2,y:r.y+r.height/2},44);ev(document.body,'pointerup',{x:0,y:0},44);await wait(10);
   ok('openings: tapping a distance asks for it, naming the corner',!$('asklen').hidden&&/(top|bottom) corner/.test($('asklenmsg').textContent),$('asklenmsg').textContent);
   $('asklenin').value='35';$('asklenok').click();await wait(10)}
  {const wl=wallOf(S.dwall),toEnd=wl.len-S.dw-S.doff;ok('openings: the typed distance moves the door',$('asklen').hidden&&near(toEnd,35,.1),[S.doff,toEnd])}
  $('opw').click();await wait(10);$('asklenin').value='100';$('asklenok').click();await wait(10);ok('openings: Width changes the door width',S.dw===100&&!$('opbar').hidden,S.dw);
  S.sel=null;opSel=w.id;render();$('opsill').click();await wait(10);$('asklenin').value='110';$('asklenok').click();await wait(10);ok('openings: Sill changes the window sill',w.sill===110);
  $('opdone').click();ok('openings: Done puts the window down',opSel==null&&$('opbar').hidden);
  opSel=w.id;render();$('oprm').click();ok('openings: Remove takes the window away',!S.obs.length&&$('opbar').hidden);
  const c=CATALOG.find(x=>x.k===K.sofa3),it=placePiece(c);it.x=225;it.y=300;it.rot=0;S.sel=it.id;render();
  ok('gaps: a picked piece shows four tappable gaps',pills('[data-gap]').length===4,pills('[data-gap]'));
  {const g0=gaps(it),lg=plan.querySelector('[data-gap="l"]'),r=lg.getBoundingClientRect();ev(lg,'pointerdown',{x:r.x+r.width/2,y:r.y+r.height/2},45);ev(document.body,'pointerup',{x:0,y:0},45);await wait(10);
   $('asklenin').value='20';$('asklenok').click();await wait(10);const g1=gaps(it);
   ok('gaps: typing the left gap moves the piece to it',near(g1.gl,20,.1)&&near(g1.gl+g1.gr,g0.gl+g0.gr,.1)&&S.sel===it.id,g1)}
  {const dg=plan.querySelector('[data-gap="d"]'),r=dg.getBoundingClientRect();ev(dg,'pointerdown',{x:r.x+r.width/2,y:r.y+r.height/2},46);ev(document.body,'pointerup',{x:0,y:0},46);await wait(10);
   $('asklenin').value='9999';$('asklenok').click();await wait(10);ok('gaps: a gap bigger than the room stops at the far wall',rectInRoom(body(it))&&near(gaps(it).gu,0,.1),gaps(it))}
  ok('openings: Add window hides while a piece is picked',$('addwin').hidden);
  freshVisit()}

 // ---- 3D models: the company's own files (needs the CDN: three.js, glTF-Transform, meshoptimizer) ----
 {const M=await m3dMod(),THREE=await import('three'),{GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
  const c=CATALOG.find(x=>!x.gen&&x.w>x.d*1.3&&x.w>x.h*1.3),toGlb=o=>new GLTFExporter().parseAsync(o,{binary:true});
  // a heavy file: an egg the product's size, about 320,000 triangles
  const egg=new THREE.Mesh(new THREE.SphereGeometry(1,400,400),new THREE.MeshStandardMaterial({color:0x6688aa}));egg.scale.set(c.w/2,c.d/2,c.h/2);
  const glb=await toGlb(egg),f=new File([glb],String(c.k).toUpperCase().replace(/-/g,'_')+'.glb');
  ok('3D files: a file named after the SKU finds its product (case and dashes ignored)',M.matchFile(f.name,CATALOG)===c,f.name);
  const r=await M.prepare(new Map(),f,c);
  ok('3D files: a .glb stays the way up it was saved and keeps the catalogue proportions',r.orient.up===0&&r.stretch<.2,[r.orient,r.stretch]);
  {const {OBJExporter}=await import('three/addons/exporters/OBJExporter.js'),box=new THREE.Mesh(new THREE.BoxGeometry(c.w,c.d,c.h),new THREE.MeshPhongMaterial());   // z up, in cm
   const o=await M.prepare(new Map(),new File([new OBJExporter().parse(box)],'cad.obj'),c);
   ok('3D files: an .obj saved z-up is stood up and keeps the catalogue proportions',o.orient.up===1&&o.orient.yaw===0&&o.stretch<.01,[o.orient,o.stretch])}
  ok('3D files: a heavy file is cut to the triangle budget and compressed',r.trisIn>300000&&r.tris<=M.BUDGET.tris*1.1&&r.bytes<glb.byteLength/5,[r.trisIn,r.tris,r.bytes,glb.byteLength]);
  const t=await M.reorient(r.glb,c,{up:0,yaw:1});
  ok('3D files: Turn turns the prepared model a quarter (its own proportions are kept)',t.stretch>.25&&t.orient.yaw===1,t.stretch);
  {let msg='';try{await M.prepare(new Map(),new File([new Uint8Array(10)],'x.stl'),c)}catch(e){msg=e.message}ok('3D files: a file type it cannot read says which ones it can',/\.glb.*\.usdz/.test(msg),msg)}
  // the panel: two files at once, one named after a SKU and one not
  for(const k of Object.keys(MODEL_REC))await modelDel(k);
  $('m3d').click();ok('3D models: the panel lists the furniture',!$('m3dwrap').hidden&&$('m3dlist').querySelectorAll('.m3row').length===CATALOG.filter(x=>!x.gen).length);
  const small=await toGlb(new THREE.Mesh(new THREE.BoxGeometry(c.w/100,c.h/100,c.d/100),new THREE.MeshStandardMaterial()));
  const dt=new DataTransfer();dt.items.add(new File([small],c.k+'.glb'));dt.items.add(new File([small],'no-such-product.glb'));
  $('m3dfile').files=dt.files;$('m3dfile').dispatchEvent(new Event('change'));
  for(let i=0;i<300&&(m3Busy||!/^Done/.test($('m3dstep').textContent));i++)await wait(50);
  ok('3D models: the file named after the SKU is prepared and saved for its product',!!MODEL_URL[c.k]&&!MODEL_REC[c.k].ok&&modelOf(c)===MODEL_URL[c.k],MODEL_REC[c.k]);
  ok('3D models: a file with no matching name waits for the rep to choose the product',m3Left&&m3Left.un.length===1&&!!$('m3dres').querySelector('[data-m3pick="0"]'));
  const c2=CATALOG.find(x=>!x.gen&&x!==c);$('m3dres').querySelector('[data-m3pick="0"]').value=c2.k;$('m3dres').querySelector('[data-m3use="0"]').click();
  for(let i=0;i<300&&(m3Busy||!MODEL_REC[c2.k]);i++)await wait(50);
  ok('3D models: Use prepares it for the chosen product',!!MODEL_URL[c2.k]&&MODEL_REC[c2.k].file==='no-such-product.glb');
  ok('3D models: an unchecked model shows as approximate',m3Status(c)[0]==='warn'&&/approximate/.test(m3Status(c)[1]));
  $('m3dlist').querySelector(`[data-m3chk="${c.k}"]`).click();for(let i=0;i<100&&!/^Drag/.test($('m3cmsg').textContent);i++)await wait(50);
  ok('3D models: Check shows the model next to the store photo, with Turn and Stand up',!$('m3chk').hidden&&!!$('m3c3d').querySelector('canvas')&&!$('m3turn').hidden&&/^Drag/.test($('m3cmsg').textContent),$('m3cmsg').textContent);
  $('m3ok').click();for(let i=0;i<40&&!modelOk(c);i++)await wait(50);
  ok('3D models: Matches the photo marks it checked',modelOk(c)&&$('m3chk').hidden&&m3Status(c)[0]==='ok');
  $('m3dlist').querySelector(`[data-m3chk="${c2.k}"]`).click();await wait(50);$('m3no').click();for(let i=0;i<40&&!(MODEL_REC[c2.k]||{}).bad;i++)await wait(50);
  ok("3D models: Doesn't match keeps it approximate and says to replace or remove it",!modelOk(c2)&&/Replace or remove/.test(m3Status(c2)[1]));
  freshVisit({mode:'rect',shape:'rect',rw:600,rl:500});S.walls=[];render();placePiece(c);ok('3D models: the 3D view uses the uploaded file',roomModel().items[0].model===MODEL_URL[c.k]);
  $('m3dlist').querySelector(`[data-m3rm="${c2.k}"]`).click();await wait(10);$('askyes').click();for(let i=0;i<40&&MODEL_REC[c2.k];i++)await wait(50);
  ok('3D models: Remove goes back to the pack model or the stand-in',!MODEL_REC[c2.k]&&modelOf(c2)===assetUrl(c2.m));
  $('m3dx').click();for(const k of Object.keys(MODEL_REC))await modelDel(k);freshVisit()}

 window.removeEventListener('error',onErr);
 ok('no page errors during the run',!errs.length,errs);
 freshVisit();
 const failed=R.filter(r=>!r.pass);
 return{passed:R.length-failed.length,failed:failed.length,results:failed.length?failed:'all passed'};
}
