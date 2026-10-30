// FitCheck: the company's own 3D files for its products (loaded the first time the 3D models panel opens; needs the CDN).
// Each file is read (.glb, .gltf, .obj, .fbx, .usdz; zips opened), stood upright and turned to face forward (guessed from the
// catalogue size), sized to the product, made light enough for an iPad (fewer triangles, smaller textures, compressed),
// and then checked by eye against the store's photo. Until someone checks it, the piece's 3D counts as approximate.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {USDZLoader} from 'three/addons/loaders/USDZLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const CDN='https://cdn.jsdelivr.net/npm/';
// What one piece may cost on an iPad: a room of 10-15 pieces at this size still turns smoothly.
export const BUDGET={tris:100000,bytes:3*1024*1024,tex:1024,maxIn:300*1024*1024};
export const EXTS=['glb','gltf','obj','fbx','usdz'];
const ext=n=>n.split('.').pop().toLowerCase(),base=n=>n.split(/[\\/]/).pop(),stem=n=>base(n).replace(/\.[^.]+$/,'');
export const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const tick=()=>new Promise(r=>setTimeout(r,0)),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const MB=b=>b<1048576?Math.max(1,Math.round(b/1024))+' KB':(b/1048576).toFixed(1)+' MB';

// glTF-Transform (cleans, simplifies and compresses the file) and meshoptimizer (the simplifier and the compression),
// fetched once, the first time a file is prepared.
let libs=null;
async function gt(){if(!libs)libs=(async()=>{const [core,fn,ex,mo]=await Promise.all(['@gltf-transform/core@4.5.1','@gltf-transform/functions@4.5.1','@gltf-transform/extensions@4.5.1','meshoptimizer@1.3.0'].map(p=>import(CDN+p+'/+esm')));
 await Promise.all([mo.MeshoptEncoder.ready,mo.MeshoptSimplifier.ready,mo.MeshoptDecoder.ready]);return{core,fn,ex,mo}})();return libs}

// Picked or dropped files, zips opened, by lower-case file name (folders inside a zip don't matter). `mains` are the 3D files;
// the rest (.bin, .mtl, textures) are what they refer to.
export async function expand(list){const files=new Map();
 for(const f of list){if(ext(f.name)!=='zip'){files.set(f.name.toLowerCase(),f);continue}
  const {unzipSync}=await import(CDN+'fflate@0.8.2/esm/browser.js'),z=unzipSync(new Uint8Array(await f.arrayBuffer()));
  for(const [p,d] of Object.entries(z)){if(p.endsWith('/')||/(^|\/)(__MACOSX|\.)/.test(p))continue;files.set(base(p).toLowerCase(),new File([d],base(p)))}}
 return{files,mains:[...files.values()].filter(f=>EXTS.includes(ext(f.name)))}}

// Which product a file is for: its name is the SKU (BH-1023.glb), or else the product's name. Spaces, dashes and case don't count.
export function matchFile(name,products){const s=norm(stem(name));if(!s)return null;
 return products.find(p=>norm(p.k)===s)||products.find(p=>norm(p.n)===s)||null}

// Reads one 3D file into three.js. Files it refers to (textures, .bin, .mtl) are looked up by name among `files`.
async function readObject(main,files){
 const made=new Map(),missing=new Set(),mgr=new THREE.LoadingManager();let pending=0;
 const st=mgr.itemStart.bind(mgr),en=mgr.itemEnd.bind(mgr);mgr.itemStart=u=>{pending++;st(u)};mgr.itemEnd=u=>{pending--;en(u)};
 mgr.setURLModifier(u=>{if(/^(data|blob):/.test(u))return u;const n=decodeURIComponent(base(u.split(/[?#]/)[0])).toLowerCase(),f=files.get(n);
  if(!f){if(!/^[a-z]+:\/\//i.test(u))missing.add(base(u));return u}
  if(!made.has(n))made.set(n,URL.createObjectURL(f));return made.get(n)});
 const done=()=>made.forEach(u=>URL.revokeObjectURL(u));
 try{let obj;const e=ext(main.name);
  if(e==='glb'||e==='gltf'){const l=new GLTFLoader(mgr).setDRACOLoader(new DRACOLoader().setDecoderPath(CDN+'three@0.160.0/examples/jsm/libs/draco/gltf/'));
   l.setMeshoptDecoder((await gt()).mo.MeshoptDecoder);obj=(await l.parseAsync(e==='glb'?await main.arrayBuffer():await main.text(),'')).scene}
  else if(e==='obj'){const text=await main.text(),l=new OBJLoader(mgr),lib=(text.match(/^mtllib\s+(.+?)\s*$/m)||[])[1],mtl=lib&&files.get(base(lib).toLowerCase());
   if(mtl){const m=new MTLLoader(mgr).parse(await mtl.text(),'');m.preload();l.setMaterials(m)}else if(lib)missing.add(base(lib));
   obj=l.parse(text)}
  else if(e==='fbx')obj=new FBXLoader(mgr).parse(await main.arrayBuffer(),'');
  else if(e==='usdz')obj=new USDZLoader(mgr).parse(await main.arrayBuffer());
  else throw new Error(`${main.name} is not a 3D file this can read (.glb, .gltf, .obj, .fbx or .usdz)`);
  for(let t=0;pending>0&&t<400;t++)await sleep(50);   // textures still loading (up to 20 s)
  return{obj,missing:[...missing],done}}
 catch(err){done();throw err}}

// Materials from .obj and .fbx files (Phong, Lambert) become the standard kind, which is what a glTF file and the 3D view use.
function standardize(root){const drop=[];
 root.traverse(o=>{if(o.isLight||o.isCamera){drop.push(o);return}if(!o.isMesh)return;
  const one=m=>!m||m.isMeshStandardMaterial||m.isMeshBasicMaterial?m:new THREE.MeshStandardMaterial({name:m.name,color:m.color?m.color.clone():0xffffff,map:m.map||null,
   normalMap:m.normalMap||null,alphaMap:m.alphaMap||null,aoMap:m.aoMap||null,emissive:m.emissive?m.emissive.clone():0,emissiveMap:m.emissiveMap||null,
   transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side,vertexColors:m.vertexColors,metalness:0,
   roughness:m.shininess!=null?Math.max(.25,1-Math.min(m.shininess,100)/120):.8});
  o.material=Array.isArray(o.material)?o.material.map(one):one(o.material);
  // textures go in the file as JPEG (much smaller), except colour maps that need see-through parts
  (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!m)return;for(const k of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap'])
   if(m[k])m[k].userData.mimeType=k==='map'&&(m.transparent||m.alphaTest>0)?'image/png':'image/jpeg'})});
 drop.forEach(o=>o.removeFromParent())}

// Ways to stand a file up: as it is (glTF and most programs: y is up), z up (many CAD and scanning programs), x up, upside down.
const UPS=[[0,0,0],[-Math.PI/2,0,0],[Math.PI/2,0,0],[0,0,Math.PI/2],[0,0,-Math.PI/2],[Math.PI,0,0]];
// Width, height, depth of the file's box after standing it up (`up`) and turning it `yaw` quarter turns.
const dimsAs=(s,up,yaw)=>{const d=up===1||up===2?[s.x,s.z,s.y]:up===3||up===4?[s.y,s.x,s.z]:[s.x,s.y,s.z];return yaw%2?[d[2],d[1],d[0]]:d};
// How far the proportions are from the catalogue's (0 = same shape).
const shapeOff=(a,c)=>{const g=v=>Math.cbrt(v.reduce((p,x)=>p*Math.max(x,1e-6),1)),ga=g(a),gc=g(c);return a.reduce((t,v,i)=>t+Math.abs(Math.log(Math.max(v,1e-6)/ga/(c[i]/gc))),0)};
// Guess which way is up and which side is the front from the catalogue size. A file that is already the right way up is
// preferred, since most are; a glTF file (y up by its rules) is turned only when the size clearly says so. Front and back
// can't be told apart from a size: the photo check has a Turn button for that.
export function guessOrient(s,c,gltf){const cd=[c.w,c.h,c.d],keep=gltf?.6:.15;let best={up:0,yaw:0},bs=Infinity;
 for(const up of [0,1,3])for(const yaw of [0,1]){const sc=shapeOff(dimsAs(s,up,yaw),cd)-(up===0?keep:0)-(yaw===0?.02:0);if(sc<bs){bs=sc;best={up,yaw}}}
 return best}

// Stands the object up, turns it, scales it evenly so it is about the catalogue size (its own proportions are kept, so it
// can still be turned later; the 3D view fits it to the exact size), centred and standing on the floor. Metres, front +z.
function place(obj,o,c){const inner=new THREE.Group(),mid=new THREE.Group(),outer=new THREE.Group();
 inner.rotation.set(...UPS[o.up]);mid.rotation.y=o.yaw*Math.PI/2;inner.add(obj);mid.add(inner);outer.add(mid);
 const b=new THREE.Box3().setFromObject(mid),s=b.getSize(new THREE.Vector3()),cd=[c.w,c.h,c.d].map(v=>v/100);
 const k=Math.cbrt(cd[0]*cd[1]*cd[2]/Math.max(s.x*s.y*s.z,1e-12));mid.scale.setScalar(k);
 const b2=new THREE.Box3().setFromObject(mid),ctr=b2.getCenter(new THREE.Vector3());mid.position.set(-ctr.x,-b2.min.y,-ctr.z);
 const got=[s.x*k,s.y*k,s.z*k],stretch=Math.max(...got.map((v,i)=>Math.abs(v/cd[i]-1)));
 return{root:outer,stretch,size:got.map(v=>Math.round(v*100))}}

const tris=doc=>{let t=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives()){if(p.getMode()!==4)continue;const i=p.getIndices(),a=p.getAttribute('POSITION');t+=(i?i.getCount():a?a.getCount():0)/3}return Math.round(t)};
// Fewer triangles where it can't be seen, then compressed. Simplifying first tries to keep the shape within 0.2% of its size;
// if that is still far over the budget, it may move edges up to 2% (about 2 cm on a sofa).
async function lighten(glb,on){const {core,fn,ex,mo}=await gt();
 const io=new core.WebIO().registerExtensions(ex.ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':mo.MeshoptEncoder,'meshopt.decoder':mo.MeshoptDecoder});
 const doc=await io.readBinary(new Uint8Array(glb));on('Cleaning up');await tick();
 await doc.transform(fn.dedup(),fn.weld());const before=tris(doc);let n=before;
 for(const error of [.002,.02]){if(n<=BUDGET.tris*1.1)break;on(`Removing detail nobody can see (${n.toLocaleString('en')} triangles)`);await tick();
  await doc.transform(fn.simplify({simplifier:mo.MeshoptSimplifier,ratio:BUDGET.tris/n,error}));n=tris(doc)}
 on('Compressing');await tick();await doc.transform(fn.prune(),fn.meshopt({encoder:mo.MeshoptEncoder,level:'medium'}));
 return{out:await io.writeBinary(doc),before,after:n}}

// The whole job for one file. c = the catalogue product {w,d,h} in cm. `orient` forces a way up and a turn (Turn and Stand
// up in the photo check); otherwise it is guessed. Returns the light .glb and what happened to it.
export async function prepare(files,main,c,{orient=null,on=()=>{}}={}){
 if(main.size>BUDGET.maxIn)throw new Error(`${main.name} is ${MB(main.size)}, too big to open in a browser. Export a lighter version (under 300 MB) from the 3D program.`);
 on('Reading the file');await tick();
 const {obj,missing,done}=await readObject(main,files);
 try{standardize(obj);obj.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(obj);
  if(box.isEmpty())throw new Error(ext(main.name)==='usdz'?`${main.name} could not be read: most iPhone scans save .usdz in Apple's own compact form, which a browser can't open yet. Save the scan as .glb or .obj from the scanning app instead.`:`${main.name} has no 3D shape in it.`);
  const o=orient||guessOrient(box.getSize(new THREE.Vector3()),c,/^(glb|gltf)$/.test(ext(main.name)));
  on('Standing it up and sizing it');await tick();
  const p=place(obj,o,c),glb=await new GLTFExporter().parseAsync(p.root,{binary:true,maxTextureSize:BUDGET.tex});
  const r=await lighten(glb,on),notes=[];
  if(missing.length)notes.push(`Not in the upload, so left out: ${missing.slice(0,4).join(', ')}${missing.length>4?` and ${missing.length-4} more`:''}.`);
  if(p.stretch>.15)notes.push(`Its proportions are ${Math.round(p.stretch*100)}% off the catalogue size (file about ${p.size.join(' x ')} cm): check the size or the file.`);
  if(r.out.byteLength>BUDGET.bytes)notes.push(`Still ${MB(r.out.byteLength)} after making it lighter, so it may slow the iPad.`);
  return{glb:new Blob([r.out],{type:'model/gltf-binary'}),file:main.name,trisIn:r.before,tris:r.after,bytesIn:main.size,bytes:r.out.byteLength,orient:o,stretch:p.stretch,notes}}
 finally{done()}}

// Turn or stand up an already prepared model (it keeps its own proportions, so a quarter turn is safe).
export const reorient=(glb,c,o,on)=>prepare(new Map(),new File([glb],'model.glb'),c,{orient:o,on});

// ---------- photo check: the model from the front, three-quarter view (like most product photos), next to the photo ----------
let R=null;   // one renderer for the panel, reused
export async function showModel(host,url){const {mo}=await gt();
 if(!R){const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio));renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;
  const sun=new THREE.DirectionalLight('#fff4e5',1.6);sun.position.set(2,4,3);scene.add(sun,new THREE.HemisphereLight('#ffffff','#cdbfae',.5));
  const cam=new THREE.PerspectiveCamera(30,1,.01,100),ctl=new OrbitControls(cam,renderer.domElement);ctl.enableDamping=true;ctl.enablePan=false;
  const loader=new GLTFLoader().setMeshoptDecoder(mo.MeshoptDecoder).setDRACOLoader(new DRACOLoader().setDecoderPath(CDN+'three@0.160.0/examples/jsm/libs/draco/gltf/'));
  R={renderer,scene,cam,ctl,loader,obj:null,run:false};
  const loop=()=>{if(!R.run)return;requestAnimationFrame(loop);const el=renderer.domElement.parentElement;if(el){const w=el.clientWidth,h=el.clientHeight;
   if(w&&h&&(renderer.domElement.width!==Math.round(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.round(h*renderer.getPixelRatio()))){renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()}}
   ctl.update();renderer.render(scene,cam)};R.start=()=>{if(!R.run){R.run=true;loop()}}}
 host.appendChild(R.renderer.domElement);R.renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
 if(R.obj){R.scene.remove(R.obj);R.obj=null}
 const g=(await R.loader.loadAsync(url)).scene;
 g.traverse(o=>{if(o.isMesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m&&'envMapIntensity' in m)m.envMapIntensity=.6})});
 R.scene.add(g);R.obj=g;const b=new THREE.Box3().setFromObject(g),s=b.getSize(new THREE.Vector3()),ctr=b.getCenter(new THREE.Vector3()),r=Math.max(s.length()/2,.1);
 const dist=r/Math.sin(THREE.MathUtils.degToRad(15))*1.05,az=THREE.MathUtils.degToRad(30),el=THREE.MathUtils.degToRad(14);
 R.cam.position.set(ctr.x+dist*Math.cos(el)*Math.sin(az),ctr.y+dist*Math.sin(el),ctr.z+dist*Math.cos(el)*Math.cos(az));R.ctl.target.copy(ctr);R.cam.near=dist/100;R.cam.far=dist*10;R.cam.updateProjectionMatrix();
 R.start();return{w:Math.round(s.x*100),h:Math.round(s.y*100),d:Math.round(s.z*100)}}
export function hideModel(){if(R){R.run=false;R.renderer.domElement.remove()}}
