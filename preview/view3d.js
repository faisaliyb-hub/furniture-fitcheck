// 3D view of a measured room: walls (with the real outline, curves included), door, windows, fixed features and
// furniture at their catalog sizes, with daylight, soft shadows and textured materials. Loaded on demand by fitcheck.html;
// three.js comes from a CDN through the page's import map.
// Units: the app works in cm, the scene in metres. Plan x -> scene x, plan y -> scene z (so the view from above matches
// the plan), height -> scene y. A piece's front faces +z before it is turned; plan rotation r becomes rotation.y = -r.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const M=.01, WALL_T=.12, CUT_H=.3;   // cm -> m; wall thickness drawn outside the measured outline; height of a cut-away wall
const V2=(x,y)=>new THREE.Vector2(x,y);

// ---------- procedural textures (no image files) ----------
function rng(seed){let s=seed>>>0||1;return()=>((s=Math.imul(s^s>>>15,1|s)+0x6D2B79F5|0,((s^s>>>7)>>>0)%100000)/100000)}
function canvasTex(size,draw,srgb=true){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
function noise(g,s,r,amt){const im=g.getImageData(0,0,s,s),d=im.data;for(let k=0;k<d.length;k+=4){const n=(r()-.5)*amt;d[k]+=n;d[k+1]+=n;d[k+2]+=n}g.putImageData(im,0,0)}
// Light grey wood grain; the material colour tints it.
function grain(g,s,r,x0,y0,w,h,lines){for(let i=0;i<lines;i++){const y=y0+r()*h,a=.04+r()*.09,amp=1+r()*4,f=Math.round(1+r()*3),ph=r()*6.28;
  g.strokeStyle=`rgba(70,40,15,${a})`;g.lineWidth=.6+r()*1.6;g.beginPath();
  for(let x=0;x<=w;x+=6){const yy=y+Math.sin(x/w*6.283*f+ph)*amp;x?g.lineTo(x0+x,yy):g.moveTo(x0+x,yy)}g.stroke()}}
const TEX={};
function textures(){if(TEX.wood)return TEX;
 TEX.wood=canvasTex(512,(g,s)=>{const r=rng(7);g.fillStyle='#fff';g.fillRect(0,0,s,s);grain(g,s,r,0,0,s,s,150);noise(g,s,r,10)});
 const weave=(g,s)=>{const r=rng(3),im=g.createImageData(s,s);for(let y=0;y<s;y++)for(let x=0;x<s;x++){const k=(y*s+x)*4,w=((x>>1)+(y>>1))&1,v=222+w*14+(r()-.5)*20;im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=255}g.putImageData(im,0,0)};
 TEX.fabric=canvasTex(256,weave);TEX.fabric.repeat.set(5,5);TEX.fabricBump=canvasTex(256,weave,false);TEX.fabricBump.repeat.set(5,5);
 // oak floor: 1024 px = 1.2 m; planks 20 cm wide in 6 rows, staggered lengths, each with its own tone and grain
 TEX.floor=canvasTex(1024,(g,s)=>{const r=rng(11),row=s/6;
  for(let i=0;i<6;i++){let x=-r()*s*.6;while(x<s){const len=s*(.45+r()*.5),t=r(),c=[190-t*16,154-t*17,112-t*15].map(Math.round);
    g.fillStyle=`rgb(${c})`;g.fillRect(x,i*row,len,row);grain(g,s,r,x,i*row+2,len,row-4,9);
    g.fillStyle='rgba(60,35,15,.55)';g.fillRect(x,i*row,2,row);x+=len}
   g.fillStyle='rgba(60,35,15,.5)';g.fillRect(0,i*row,s,2)}noise(g,s,r,8)});
 TEX.floor.repeat.set(1/1.2,1/1.2);
 // soft contact shadow under each piece
 TEX.shadow=canvasTex(128,(g,s)=>{const gr=g.createRadialGradient(s/2,s/2,s*.12,s/2,s/2,s/2);gr.addColorStop(0,'rgba(0,0,0,.7)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,s,s)});
 return TEX}

// ---------- finishes: the catalog's free-text finish ("beige-grey fabric", "birch, light beige fabric") -> materials ----------
const COLORS=[['grey-green','#7d8b7e'],['black-brown','#3b2d26'],['light brown','#a8835e'],['beige-grey','#b9b0a4'],['light beige','#d8ccb7'],['dark grey','#4a4c4f'],
 ['light grey','#c9cac8'],['white','#efede8'],['black','#262524'],['oak','#c39a6b'],['ash','#d6c19c'],['birch','#dcc29a'],['walnut','#6a4930'],['pine','#d8b27a'],
 ['beech','#d4a77a'],['beige','#cbbda6'],['grey','#8d9092'],['green','#5f7b62'],['blue','#3f5b7f'],['red','#8e3b35'],['brown','#6f4e37'],['yellow','#d6b44a'],['pink','#d9a7a7']];
const WOOD=/oak|ash|birch|walnut|pine|beech|teak|wood|veneer|black-brown|brown/,FABRIC=/fabric|velvet|leather|linen|cotton|wool|boucl/;
function finishParts(f){return String(f||'').toLowerCase().split(',').map(p=>p.trim()).filter(Boolean)
 .map(p=>({color:(COLORS.find(([k])=>p.includes(k))||[])[1],wood:WOOD.test(p),fabric:FABRIC.test(p)}))}
const MATS=new Map();
function mat(kind,color){const key=kind+color;if(MATS.has(key))return MATS.get(key);const T=textures();let m;
 if(kind==='fabric')m=new THREE.MeshPhysicalMaterial({color,map:T.fabric,bumpMap:T.fabricBump,bumpScale:1.5,roughness:.95,sheen:.35,sheenRoughness:.8,sheenColor:new THREE.Color(color).lerp(new THREE.Color('#ffffff'),.2)});
 else if(kind==='wood')m=new THREE.MeshStandardMaterial({color,map:T.wood,roughness:.5});
 else if(kind==='paint')m=new THREE.MeshStandardMaterial({color,roughness:.38});
 else if(kind==='metal')m=new THREE.MeshStandardMaterial({color,metalness:1,roughness:.32});
 else if(kind==='linen')m=new THREE.MeshPhysicalMaterial({color,map:T.fabric,bumpMap:T.fabricBump,bumpScale:.8,roughness:1,sheen:.3,sheenColor:new THREE.Color('#ffffff')});
 else m=new THREE.MeshStandardMaterial({color,roughness:.6});
 m.envMapIntensity=.45;MATS.set(key,m);return m}
// Body = main panels or frame; soft = upholstery; accent = a second finish (a top, a frame).
function finishMats(item){const parts=finishParts(item.finish),soft=parts.find(p=>p.fabric&&p.color),wood=parts.find(p=>p.wood&&p.color),first=parts.find(p=>p.color);
 const solid=p=>p?mat(p.wood?'wood':'paint',p.color):null;
 const second=parts.filter(p=>p.color)[1];
 return{body:solid(first&&!first.fabric?first:wood)||mat('paint','#efede8'),accent:solid(second&&!second.fabric?second:null),
  soft:mat('fabric',(soft||first||{color:'#9c9890'}).color||'#9c9890'),frame:wood?solid(wood):null}}

// ---------- furniture models: footprint centred on the origin, floor at y = 0, front towards +z ----------
function piece(geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o}
const box=(g,m,w,h,d,x,y,z)=>{const o=piece(new THREE.BoxGeometry(w,h,d),m,x,y,z);g.add(o);return o};
const soft=(g,m,w,h,d,x,y,z,r)=>{const o=piece(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.001,h/2-.001,d/2-.001)),m,x,y,z);g.add(o);return o};
function legs(g,m,w,d,h,s,inset){const x=w/2-inset-s/2,z=d/2-inset-s/2;for(const [a,b] of [[-x,-z],[x,-z],[-x,z],[x,z]])box(g,m,s,h,s,a,h/2,b)}

function sofa(w,d,h,F,seats){const g=new THREE.Group(),up=F.soft,fr=F.frame||up,legM=F.frame||mat('wood','#3b2d26');
 const legH=.07,armW=Math.min(.24,Math.max(.1,w*.11)),armH=Math.min(h,.64),backD=Math.min(.24,d*.27),baseTop=.32,iw=w-2*armW;
 legs(g,legM,w,d,legH,.045,.05);
 soft(g,up,w-.02,baseTop-legH,d-.02,0,legH+(baseTop-legH)/2,0,.03);
 for(const s of [-1,1])soft(g,fr,armW,armH-legH,d,s*(w/2-armW/2),legH+(armH-legH)/2,0,.05);
 soft(g,up,iw+.02,h-baseTop,backD,0,baseTop+(h-baseTop)/2,-d/2+backD/2,.05);
 const n=seats||Math.max(1,Math.round(iw/.62)),cw=iw/n,sd=d-backD-.02,ch=.15;
 for(let i=0;i<n;i++){const x=-iw/2+cw*(i+.5);
  soft(g,up,cw-.012,ch,sd,x,baseTop+ch/2,backD/2+.005,.06);
  const bh=Math.min(.48,h-baseTop-ch-.02),cb=soft(g,up,cw-.02,bh,.17,x,baseTop+ch+bh/2,-d/2+backD+.085,.07);cb.rotation.x=-.1}
 return g}
function diningChair(w,d,h,F){const g=new THREE.Group(),m=F.frame||F.body,seatH=Math.min(.46,h*.55),t=.035;
 legs(g,m,w,d,seatH-.03,t,.01);soft(g,F.soft&&finishHasFabric(F)?F.soft:m,w,.04,d,0,seatH-.01,0,.012);
 for(const s of [-1,1])box(g,m,t,h-seatH,t,s*(w/2-.01-t/2),seatH+(h-seatH)/2,-d/2+.01+t/2);
 const bh=Math.min(.22,(h-seatH)*.55),bk=soft(g,m,w-.03,bh,.025,0,h-bh/2-.02,-d/2+.03,.01);bk.rotation.x=-.08;return g}
const finishHasFabric=F=>F._fabric;
function table(w,d,h,F,kind){const g=new THREE.Group(),top=F.accent||F.body,leg=F.body;
 if(kind==='coffee'||kind==='side'){const tt=Math.min(.05,h*.12),s=Math.min(.05,w*.12);legs(g,leg,w,d,h-tt,s,0);box(g,top,w,tt,d,0,h-tt/2,0);
  if(kind==='coffee'&&w>.7)box(g,top,w-2*s,.02,d-2*s,0,.13,0);return g}
 const tt=.03,s=.05;legs(g,leg,w,d,h-tt,s,.04);box(g,top,w,tt,d,0,h-tt/2,0);
 for(const z of [-1,1])box(g,leg,w-.18,.08,.02,0,h-tt-.04,z*(d/2-.07));for(const x of [-1,1])box(g,leg,.02,.08,d-.18,x*(w/2-.07),h-tt-.04,0);return g}
function desk(w,d,h,F){const g=new THREE.Group(),m=F.body,tt=.025,uw=Math.min(.4,w*.36),ux=w/2-uw/2;
 box(g,m,w,tt,d,0,h-tt/2,0);box(g,m,uw,h-tt,d,ux,(h-tt)/2,0);box(g,m,.02,h-tt,d,-w/2+.01,(h-tt)/2,0);box(g,m,w-uw-.02,.35,.016,-uw/2,h-tt-.175,-d/2+.012);
 const handle=mat('metal','#9a9a98');for(let i=0;i<2;i++){const y=h-tt-.12-i*.3;box(g,m,uw-.01,.26,.01,ux,y,d/2+.005);box(g,handle,.1,.012,.012,ux,y+.08,d/2+.016)}return g}
function bed(w,d,h,F){const g=new THREE.Group(),m=F.body,sideT=.03,headT=.05,frameH=Math.min(.38,h),inW=w-2*sideT,inD=d-headT-sideT;
 box(g,m,w,h,headT,0,h/2,-d/2+headT/2);box(g,m,w,frameH,sideT,0,frameH/2,d/2-sideT/2);
 for(const s of [-1,1])box(g,m,sideT,frameH,inD,s*(w/2-sideT/2),frameH/2,(headT-sideT)/2);
 const mt=.2,mTop=.3+mt;soft(g,mat('linen','#f4f2ee'),inW-.01,mt,inD-.01,0,.3+mt/2,(headT-sideT)/2,.06);
 soft(g,mat('linen','#dfe4e6'),inW+.01,.07,inD*.72,0,mTop+.02,d/2-sideT-inD*.36,.035);
 const n=inW>1.15?2:1,pw=inW/n-.08;for(let i=0;i<n;i++){const p=soft(g,mat('linen','#fbfaf7'),pw,.13,.36,-inW/2+(inW/n)*(i+.5),mTop+.07,-d/2+headT+.24,.06);p.rotation.x=-.25}return g}
function wardrobe(w,d,h,F){const g=new THREE.Group(),m=F.body,pl=.05,n=Math.max(1,Math.round(w/.4)),dw=w/n,metal=mat('metal','#a8a8a6');
 box(g,mat('paint','#3a3836'),w-.04,pl,d-.06,0,pl/2,-.01);box(g,m,w,h-pl,d-.02,0,pl+(h-pl)/2,-.01);
 for(let i=0;i<n;i++){const x=-w/2+dw*(i+.5);box(g,m,dw-.004,h-pl-.008,.018,x,pl+(h-pl)/2,d/2-.009);
  const side=i%2?-1:1;box(g,metal,.012,.16,.012,x+side*(dw/2-.04),pl+(h-pl)*.5,d/2+.006)}return g}
function bookcase(w,d,h,F){const g=new THREE.Group(),m=F.body,t=.018,n=Math.max(1,Math.round((h-.08)/.36));
 for(const s of [-1,1])box(g,m,t,h,d,s*(w/2-t/2),h/2,0);box(g,m,w,t,d,0,h-t/2,0);box(g,m,w-2*t,.06,d,0,.03,0);box(g,m,w-2*t,h-.07,.004,0,.065+(h-.07)/2,-d/2+.002);
 for(let i=1;i<n;i++)box(g,m,w-2*t,t,d-.02,0,.06+(h-.06-t)*i/n,.01);return g}
function tvBench(w,d,h,F){const g=new THREE.Group(),m=F.body,t=.03,legH=Math.min(.06,h*.2);
 legs(g,m,w,d,legH,.05,.02);box(g,m,w,t,d,0,h-t/2,0);box(g,m,w,.02,d,0,legH+.01,0);for(const s of [-1,1])box(g,m,.03,h-legH-t,d,s*(w/2-.015),legH+(h-legH-t)/2,0);
 if(w>1)box(g,m,.02,h-legH-t,d-.02,0,legH+(h-legH-t)/2,0);return g}
function bedside(w,d,h,F){const g=new THREE.Group(),m=F.body,top=F.accent||m,legH=Math.min(.12,h*.18),metal=mat('metal','#a8a8a6');
 legs(g,m,w,d,legH,.035,.01);box(g,m,w,h-legH-.025,d,0,legH+(h-legH-.025)/2,0);box(g,top,w+.01,.025,d+.01,0,h-.0125,0);
 const fh=(h-legH-.025)*.42;box(g,m,w-.02,fh,.012,0,h-.025-fh/2-.01,d/2+.006);box(g,metal,.08,.012,.012,0,h-.025-fh/2-.01,d/2+.018);return g}
function cabinet(w,d,h,F){const g=new THREE.Group(),m=F.body;soft(g,m,w,h,d,0,h/2,0,.01);return g}

// Scale and move a model so its outer box is exactly w x h x d, centred, standing on the floor. Handles, cushions and
// legs are part of the catalog size, so nothing may stick out past the footprint the plan checks against.
function fit(inner,w,h,d){const b=new THREE.Box3().setFromObject(inner),s=b.getSize(new THREE.Vector3());
 inner.scale.set(w/(s.x||w),h/(s.y||h),d/(s.z||d));const b2=new THREE.Box3().setFromObject(inner);
 inner.position.set(-(b2.min.x+b2.max.x)/2,-b2.min.y,-(b2.min.z+b2.max.z)/2);const g=new THREE.Group();g.add(inner);return g}
// Which model a catalog piece gets, from its type and name.
function modelFor(it){return fit(baseModel(it),it.w*M,it.h*M,it.d*M)}
function baseModel(it){const n=it.name.toLowerCase(),w=it.w*M,d=it.d*M,h=it.h*M,F=finishMats(it);F._fabric=finishParts(it.finish).some(p=>p.fabric);
 switch(it.type){
  case 'sofa':return sofa(w,d,h,F);
  case 'chair':return /arm|lounge|recliner|easy/.test(n)||(w>.6&&d>.65)?sofa(w,d,h,F,1):diningChair(w,d,h,F);
  case 'table':return /desk/.test(n)?desk(w,d,h,F):table(w,d,h,F,h<.55?'coffee':'dining');
  case 'side':return table(w,d,h,F,'side');
  case 'bed':return bed(w,d,h,F);
  case 'storage':return /wardrobe|closet|pax/.test(n)||(h>1.4&&d>.45)?wardrobe(w,d,h,F):/book|shelf|billy/.test(n)||(h>1&&d<.42)?bookcase(w,d,h,F)
   :/tv|media/.test(n)||(h<.6&&w>.8)?tvBench(w,d,h,F):/bedside|night/.test(n)?bedside(w,d,h,F):cabinet(w,d,h,F);
  default:return cabinet(w,d,h,F)}}

// A real 3D file for the product (catalog column "model"): scaled to the catalog width, height and depth. glTF's front is +z, like ours.
const loader=new GLTFLoader(),GLB=new Map();
async function fileModel(url,it){if(!GLB.has(url))GLB.set(url,loader.loadAsync(url));const src=(await GLB.get(url)).scene.clone(true);
 const b=new THREE.Box3().setFromObject(src),s=b.getSize(new THREE.Vector3());src.scale.set(it.w*M/(s.x||1),it.h*M/(s.y||1),it.d*M/(s.z||1));
 const b2=new THREE.Box3().setFromObject(src),c=b2.getCenter(new THREE.Vector3());src.position.sub(new THREE.Vector3(c.x,b2.min.y,c.z));
 src.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});const g=new THREE.Group();g.add(src);return g}

// ---------- room shell ----------
// Footprint quad of a wall stretch: inner points on the outline, outer points pushed out by the wall thickness.
function prism(q,y0,y1,m){const P=[...q.map(p=>new THREE.Vector3(p.x,y0,p.y)),...q.map(p=>new THREE.Vector3(p.x,y1,p.y))];
 const c=P.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/8),pos=[];
 for(const f of [[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]){const v=f.map(i=>P[i]),fc=v.reduce((a,p)=>a.add(p.clone()),new THREE.Vector3()).multiplyScalar(.25);
  const nrm=new THREE.Vector3().subVectors(v[1],v[0]).cross(new THREE.Vector3().subVectors(v[2],v[0]));if(nrm.dot(fc.sub(c))<0)v.reverse();
  for(const p of [v[0],v[1],v[2],v[0],v[2],v[3]])pos.push(p.x,p.y,p.z)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
 const o=new THREE.Mesh(geo,m);o.castShadow=o.receiveShadow=true;return o}

function buildRoom(R,scene){const T=textures(),H=R.H*M,loop=R.loop.map(p=>({x:p.x*M,y:p.y*M})),n=loop.length;
 const wallM=new THREE.MeshStandardMaterial({color:'#e8e3da',roughness:.92,envMapIntensity:.6});
 const trimM=mat('paint','#f7f6f2'),glassM=new THREE.MeshPhysicalMaterial({color:'#cfe2ea',roughness:.05,metalness:0,transparent:true,opacity:.22,depthWrite:false});
 let area=0;loop.forEach((p,i)=>{const q=loop[(i+1)%n];area+=p.x*q.y-q.x*p.y});const cw=area>0;
 const out=loop.map((a,i)=>{const b=loop[(i+1)%n],l=Math.hypot(b.x-a.x,b.y-a.y)||1,dx=(b.x-a.x)/l,dy=(b.y-a.y)/l;return{x:cw?dy:-dy,y:cw?-dx:dx,l,dx,dy}});   // outward normal per edge
 const outer=loop.map((p,i)=>{const n0=out[(i-1+n)%n],n1=out[i],mx=n0.x+n1.x,my=n0.y+n1.y,ml=Math.hypot(mx,my)||1,ux=mx/ml,uy=my/ml,k=Math.min(3,1/Math.max(.2,ux*n1.x+uy*n1.y));
  return{x:p.x+ux*WALL_T*k,y:p.y+uy*WALL_T*k}});
 const g=new THREE.Group(),walls=[];scene.add(g);
 // floor
 const shape=new THREE.Shape(loop.map(p=>V2(p.x,-p.y))),fl=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({map:T.floor,roughness:.5,envMapIntensity:.4}));
 fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
 // walls, edge by edge, split around doors and windows
 loop.forEach((a,i)=>{const e=out[i],b=loop[(i+1)%n],ops=R.openings.filter(o=>o.edge===i).map(o=>({t0:o.t0*M,t1:o.t1*M,y0:o.y0*M,y1:o.y1*M,kind:o.kind}));
  const at=t=>({x:a.x+e.dx*t,y:a.y+e.dy*t}),oat=t=>t<=1e-6?outer[i]:t>=e.l-1e-6?outer[(i+1)%n]:{x:a.x+e.dx*t+e.x*WALL_T,y:a.y+e.dy*t+e.y*WALL_T};
  const cuts=[...new Set([0,e.l,...ops.flatMap(o=>[o.t0,o.t1])])].sort((p,q)=>p-q),wg={meshes:[],low:[],parts:[],nx:e.x,nz:e.y,mx:(a.x+b.x)/2,mz:(a.y+b.y)/2};
  // solid wall from the floor to `top`, leaving the openings out
  const solid=(q,holes,top,list)=>{let y=0;for(const o of holes){const y1=Math.min(o.y0,top);if(y1>y+1e-4)list.push(prism(q,y,y1,wallM));y=Math.max(y,o.y1);if(y>=top)return}
   if(top>y+1e-4)list.push(prism(q,y,top,wallM))};
  for(let k=0;k<cuts.length-1;k++){const s0=cuts[k],s1=cuts[k+1];if(s1-s0<1e-4)continue;const mid=(s0+s1)/2,holes=ops.filter(o=>o.t0<=mid&&o.t1>=mid).sort((p,q)=>p.y0-q.y0);
   const q=[at(s0),at(s1),oat(s1),oat(s0)];solid(q,holes,H,wg.meshes);solid(q,holes,Math.min(H,CUT_H),wg.low)}
  wg.low.forEach(o=>o.visible=false);
  // skirting board along the inner face, except across a door
  const door=ops.find(o=>o.kind==='door'),runs=door?[[0,door.t0],[door.t1,e.l]]:[[0,e.l]];
  for(const [s0,s1] of runs)if(s1-s0>.02){const p0=at(s0),p1=at(s1),sk=prism([p0,p1,{x:p1.x-e.x*.012,y:p1.y-e.y*.012},{x:p0.x-e.x*.012,y:p0.y-e.y*.012}],0,.08,trimM);wg.parts.push(sk)}
  for(const o of ops)if(o.kind==='window'){const p0=at(o.t0),p1=at(o.t1),c={x:(p0.x+p1.x)/2+e.x*WALL_T/2,y:(p0.y+p1.y)/2+e.y*WALL_T/2},len=o.t1-o.t0,hh=o.y1-o.y0,rot=Math.atan2(e.dy,e.dx);
   const win=new THREE.Group();win.position.set(c.x,o.y0,c.y);win.rotation.y=-rot;
   const gl=new THREE.Mesh(new THREE.BoxGeometry(len,hh,.01),glassM);gl.position.y=hh/2;win.add(gl);
   for(const [w2,h2,x,y2] of [[len,.05,0,.025],[len,.05,0,hh-.025],[.05,hh,-len/2+.025,hh/2],[.05,hh,len/2-.025,hh/2],[.04,hh,0,hh/2]]){const f=new THREE.Mesh(new THREE.BoxGeometry(w2,h2,.06),trimM);f.position.set(x,y2,0);f.castShadow=true;win.add(f)}
   // the group's +z is (-dy, dx) on the plan; the sill goes from mid-wall to 5 cm into the room
   const zOut=Math.sign(-e.dy*e.x+e.dx*e.y)||1,sd=WALL_T/2+.05,sill=new THREE.Mesh(new THREE.BoxGeometry(len+.08,.03,sd),trimM);
   sill.position.set(0,-.015,-zOut*sd/2);sill.receiveShadow=true;win.add(sill);
   wg.parts.push(win)}
  [...wg.meshes,...wg.low,...wg.parts].forEach(o=>g.add(o));walls.push(wg)});
 // door: casing on the room side and the leaf opened 90 degrees into the room, hinged at the start of the opening
 const D=R.door;if(D){const e=out[D.edge],a=loop[D.edge],t0=D.t0*M,t1=D.t1*M,dh=D.y1*M,w=t1-t0,hx=a.x+e.dx*t0,hz=a.y+e.dy*t0,inx=-e.x,inz=-e.y,rot=Math.atan2(e.dy,e.dx);
  const cas=new THREE.Group();cas.position.set(a.x+e.dx*(t0+w/2)+inx*.008,0,a.y+e.dy*(t0+w/2)+inz*.008);cas.rotation.y=-rot;
  for(const [w2,h2,x,y2] of [[.07,dh+.07,-w/2-.035,(dh+.07)/2],[.07,dh+.07,w/2+.035,(dh+.07)/2],[w+.14,.07,0,dh+.035]]){const f=new THREE.Mesh(new THREE.BoxGeometry(w2,h2,.016),trimM);f.position.set(x,y2,0);f.castShadow=true;cas.add(f)}
  g.add(cas);walls[D.edge].parts.push(cas);
  const leafW=w-.02,leaf=new THREE.Group();leaf.position.set(hx+e.dx*.02+inx*(leafW/2),0,hz+e.dy*.02+inz*(leafW/2));leaf.rotation.y=Math.atan2(inx,inz);
  const panel=new THREE.Mesh(new THREE.BoxGeometry(.04,dh-.01,leafW),mat('paint','#f4f2ee'));panel.position.y=(dh-.01)/2;panel.castShadow=panel.receiveShadow=true;leaf.add(panel);
  for(const s of [-1,1]){const hd=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,.13),mat('metal','#b4b4b2'));hd.position.set(s*.035,1.0,leafW/2-.09);leaf.add(hd)}
  g.add(leaf)}
 // cut-outs (quick rectangle mode) are solid parts of the building; fixed features
 const block=(r,y0,y1,m)=>prism([{x:r.x*M,y:r.y*M},{x:(r.x+r.w)*M,y:r.y*M},{x:(r.x+r.w)*M,y:(r.y+r.d)*M},{x:r.x*M,y:(r.y+r.d)*M}],y0,y1,m);
 R.cuts.forEach(c=>g.add(block(c,0,H,wallM)));
 R.obs.forEach(o=>{const h=Math.min(H,(o.h||0)*M);
  if(o.kind==='column')g.add(block(o,0,H,wallM));
  else if(o.kind==='builtin')g.add(block(o,0,h||2.2,mat('paint','#e4e0d8')));
  else if(o.kind==='radiator'){const r=block({x:o.x,y:o.y,w:o.w,d:o.d},.1,Math.max(.2,h||.6),mat('paint','#f2f1ee'));g.add(r)}
  else if(o.kind==='low')g.add(block(o,Math.min(H,(o.h||120)*M),H,wallM));
  else if(o.kind==='stairs'){const steps=Math.max(3,Math.round(H/.18)),long=o.d>=o.w,len=(long?o.d:o.w)*M,wood=mat('wood','#b7895c');
   for(let s=0;s<steps;s++){const f=s/steps,r=long?{x:o.x,y:o.y+o.d*f,w:o.w,d:o.d/steps}:{x:o.x+o.w*f,y:o.y,w:o.w/steps,d:o.d};g.add(block(r,0,H*(s+1)/steps,wood))}}
  else if(o.kind==='xdoor'){const p=new THREE.Mesh(new THREE.PlaneGeometry(o.w*M,o.d*M),new THREE.MeshBasicMaterial({color:'#2f6f5e',transparent:true,opacity:.12,depthWrite:false}));
   p.rotation.x=-Math.PI/2;p.position.set((o.x+o.w/2)*M,.003,(o.y+o.d/2)*M);g.add(p)}});
 const xs=loop.map(p=>p.x),ys=loop.map(p=>p.y);
 return{group:g,walls,wallM,min:{x:Math.min(...xs),z:Math.min(...ys)},max:{x:Math.max(...xs),z:Math.max(...ys)},H,out,loop}}

// ---------- the viewer ----------
export async function open(container,R){
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;container.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(renderer),.04).texture;pm.dispose();
 scene.background=new THREE.Color('#e7e9ea');
 const room=buildRoom(R,scene),cx=(room.min.x+room.max.x)/2,cz=(room.min.z+room.max.z)/2,size=Math.max(room.max.x-room.min.x,room.max.z-room.min.z,2);
 scene.add(new THREE.HemisphereLight('#ffffff','#cdbfae',.45));
 const lamp=new THREE.PointLight('#ffe9cc',18,0,2);lamp.position.set(cx,room.H-.15,cz);scene.add(lamp);   // ceiling light: fills the walls from inside
 const sun=new THREE.DirectionalLight('#fff1dc',2.6);sun.position.set(cx+size*.55,room.H+size*1.1,cz+size*.45);sun.target.position.set(cx,0,cz);scene.add(sun,sun.target);
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-size,right:size,top:size,bottom:-size,near:.1,far:room.H+size*4});sun.shadow.camera.updateProjectionMatrix();
 sun.shadow.bias=-.0003;sun.shadow.normalBias=.015;
 // furniture
 const pieces=[],notes=[];
 for(const it of R.items){let g=null;
  if(it.model)try{g=await fileModel(it.model,it)}catch(e){notes.push(`${it.name}: the 3D file could not be loaded, a stand-in model is shown.`)}
  if(!g)g=modelFor(it);
  g.position.set(it.x*M,0,it.y*M);g.rotation.y=-it.rot*Math.PI/180;g.userData.item=it;scene.add(g);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(it.w*M*1.18,it.d*M*1.18),new THREE.MeshBasicMaterial({map:textures().shadow,transparent:true,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.y=.002;g.add(sh);pieces.push(g)}
 // camera and controls
 const camera=new THREE.PerspectiveCamera(45,1,.05,200),controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.495;controls.minDistance=.1;controls.maxDistance=size*8;controls.zoomSpeed=1.4;controls.zoomToCursor=true;controls.screenSpacePanning=true;   // zoom goes where you pinch or point
 // Overview looks from the side opposite the door, so the door's wall stays solid; "from the door" stands just past the open leaf.
 const de=R.door?room.out[R.door.edge]:{x:0,y:-1,dx:1,dy:0};
 function setView(v){if(v==='eye'&&R.door){const a=room.loop[R.door.edge],t=(R.door.t0+R.door.t1)/2*M+(R.door.t1-R.door.t0)*M*.35,inn=(R.door.t1-R.door.t0)*M+.35;
   camera.position.set(a.x+de.dx*t-de.x*inn,1.6,a.y+de.dy*t-de.y*inn);controls.target.set(cx,.9,cz)}
  else{const f=Math.max(1,1.15/camera.aspect);   // tall phone screens: step back so the whole room fits across
   camera.position.set(cx+(-de.x*size*1.05+de.dx*size*.5)*f,room.H+size*.95*f,cz+(-de.y*size*1.05+de.dy*size*.5)*f);controls.target.set(cx,.3,cz)}
  controls.update();dirty=true}
 // walls between the camera and the room are cut down low, like a doll's house
 function fade(){const p=camera.position;room.walls.forEach(w=>{const f=(p.x-w.mx)*w.nx+(p.z-w.mz)*w.nz>.05;if(w.faded===f)return;w.faded=f;
  w.meshes.forEach(m=>m.visible=!f);w.low.forEach(m=>m.visible=f);w.parts.forEach(o=>o.visible=!f)})}
 let dirty=true,raf=0;const resize=()=>{const w=container.clientWidth||1,h=container.clientHeight||1;renderer.setSize(w,h,false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true};
 const ro=new ResizeObserver(resize);ro.observe(container);resize();
 const render=()=>{fade();renderer.render(scene,camera)};
 const loop=()=>{raf=requestAnimationFrame(loop);if(controls.update()||dirty){dirty=false;render()}};
 setView('overview');loop();
 return{scene,camera,renderer,controls,pieces,walls:room.walls,notes,setView,render,
  close(){cancelAnimationFrame(raf);ro.disconnect();controls.dispose();scene.traverse(o=>{if(o.isMesh)o.geometry.dispose()});renderer.dispose();renderer.domElement.remove()}}}
