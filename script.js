'use strict';
/* ===== ZÉ DOSE E A TORRE DA RESSACA — script.js =====
   Seções: 1 Constantes/sprites · 2 Dados (bebidas, fases) · 3 Desenho dos monstros
   4 Lógica (jogador, inimigos, chefes) · 5 Desenho do mundo/HUD · 6 Som · 7 Menus e loop */
const cv=document.getElementById('c'),X=cv.getContext('2d'),W=960,H=540,T=40,GY=440,$=i=>document.getElementById(i);
const R=Math.random,sg=Math.sign,ab=Math.abs,sn=Math.sin,OUT='#1b0d08';

/* ---------- 1. SPRITE DO ZÉ (recortes do sprite.png: x,y,larg,alt) ---------- */
const img=new Image();img.src='sprite.png';
const S={idle:[452,69,203,280],walk:[726,63,209,293],run1:[988,62,231,284],run2:[1269,53,232,281],jump:[448,384,223,294],
 fall:[721,425,205,234],hurt:[1263,490,233,207],dead:[945,550,295,123],big:[51,116,315,598],
 f:[[45,767,219,193],[305,768,208,188],[548,764,204,193],[790,761,232,192],[1056,766,203,193],[1300,763,194,192]]}; // rostos: neutro,surpreso,bravo,grito,triste,feliz
const SC=.27; // escala do sprite no jogo
function spr(r,cx,by,sc,fl,al){if(!img.complete)return;X.save();X.globalAlpha=al==null?1:al;X.translate(cx,by);if(fl)X.scale(-1,1);
 X.drawImage(img,r[0],r[1],r[2],r[3],-r[2]*sc/2,-r[3]*sc,r[2]*sc,r[3]*sc);X.restore()}

/* ---------- 2. DADOS ---------- */
// Bebidas mágicas (ordem = teclas 1..7). cost = energia gasta, dur = duração em frames
const D={beer:{n:'Cerveja',c:'#f2b01e',p:'Superforça — E quebra paredes rachadas',cost:25},
 wine:{n:'Vinho',c:'#a3214f',p:'Telecinese — E move plataformas roxas',cost:20},
 vodka:{n:'Vodka',c:'#8fdcff',p:'Anti-frio — E por 10s (zonas geladas)',cost:30,dur:600},
 whisky:{n:'Uísque',c:'#d9822b',p:'Escudo — E por 5s',cost:30,dur:300},
 tequila:{n:'Tequila',c:'#c9e65a',p:'Impulso explosivo — E',cost:25},
 champagne:{n:'Champanhe',c:'#fff0a0',p:'Pulo duplo (passivo)',cost:0},
 rum:{n:'Rum',c:'#8a4a22',p:'Atravessa barreiras mágicas — E por 7s',cost:30,dur:420}};
const DK=Object.keys(D);
/* Fases. Unidades em TILES (40px). Chão fica na linha 11.
 pit:[x,larg] buracos · pl:[x,y,larg,alt,tipo,dx,dy] plataformas
 tipos: 0 madeira,1 móvel(vai e volta),2 gelo,3 parede rachada(Cerveja),4 telecinese(Vinho, desloca dx,dy),5 barreira mágica(Rum)
 en:[tipo,x,y] inimigos (0 garrafa,1 barril,2 copo,3 espuma,4 guardião) · it:[bebida|heart,x,y]
 sp:[x,y,larg] cacos de vidro · zn:[x,larg,0 frio|1 escorrega] · ck:checkpoints · ax:início da arena do chefe · door:porta de saída */
const LV=[
{n:'1 · A Taverna Destruída',len:64,ax:51,door:62,sky:['#2b1710','#6a4228'],f:['#3a2316','#4d2f1c'],gr:'#6b4426',ac:'#e0a040',pc:'#1a0d08',ec:'#3f9a4a',wx:0,
 pit:[[24,3],[38,3]],pl:[[10,8,4,.5,0],[18,7,3,.5,0],[28,8,4,.5,0],[33,6,3,.5,0],[43,8,3,.5,0],[47,1,1,10,3]],
 en:[[0,14,9],[0,20,9],[2,31,9],[0,36,9],[1,44,9],[0,49,9]],it:[['beer',34,5],['heart',29,7]],sp:[[16,11,2]],zn:[],ck:[20,41],
 dlg:['Zé: Ugh... que cheiro é esse? Cadê minha taverna?!','Bilhete: "Reúna as bebidas lendárias e suba a Torre da Ressaca. — O Grande Barman"','SETAS/WASD movem, ESPAÇO pula, SHIFT corre. Pise nos inimigos!','Pegue a Cerveja e aperte E: o soco quebra a parede rachada!']},
{n:'2 · O Vale da Cerveja',len:90,ax:78,door:88,sky:['#f4b942','#fff0b3'],f:['#e0a030','#c07a18'],gr:'#b8731f',ac:'#fff4c0',pc:'#fff7d6',ec:'#e8a420',wx:1,
 pit:[[10,5],[22,5],[36,9],[58,5]],pl:[[10.5,9,2,.5,1,2,0],[23,9,2.5,.5,1,2,0],[59,9,2,.5,1,2,0],[15,8,3,.5,0],[29,8,3,.5,0],[52,8,3,.5,0],[56,7,3,.5,0],[66,8,3,.5,0],[46,1,1,10,3],[74,1,1,10,3]],
 en:[[0,17,9],[0,26,9],[2,48,9],[1,50,9],[4,54,9],[3,64,6],[0,70,9],[1,72,9]],it:[['tequila',30,7],['whisky',49,9],['heart',55,6]],sp:[[19,11,2],[68,11,3]],zn:[],ck:[16,34,64],
 dlg:['Rios de espuma! Cuidado: cair neles é fatal.','Tequila: aperte E para um impulso explosivo no ar e cruzar o abismo largo!','Paredes rachadas pedem a Cerveja (tecla 1 + E).']},
{n:'3 · Montanhas Congeladas da Vodka',len:92,ax:80,door:90,sky:['#4f7fc2','#e3f6ff'],f:['#9fc5e8','#7aa7d3'],gr:'#c9e4f4',ac:'#ffffff',pc:'#2f6fa8',ec:'#7ec8e3',wx:2,
 pit:[[14,4],[44,4],[60,4],[68,5]],pl:[[14.5,9,2.5,.5,1,1,0],[44.5,9,2.5,.5,1,1,0],[60.5,9,2.5,.5,1,1,0],[68.5,9,2,.5,1,2,0],[28,8,3,.5,2],[33,7,3,.5,2],[51,8,3,.5,2],[56,6,3,.5,2],[76,1,1,10,3]],
 en:[[0,24,9],[3,26,6],[2,40,9],[4,53,9],[0,63,9],[1,72,9],[2,74,9]],it:[['vodka',6,9],['champagne',57,4],['heart',34,5]],sp:[[30,11,2],[74,11,2]],zn:[[20,14,0],[36,8,1],[48,12,0],[72,6,1]],ck:[12,42,65],
 dlg:['Frio de rachar! Zonas azuis ferem sem a Vodka (E dá 10s de proteção).','Gelo escorrega — a Vodka também dá tração!','Champanhe: pulo duplo! Aperte ESPAÇO de novo no ar.']},
{n:'4 · Os Vinhedos Amaldiçoados',len:98,ax:84,door:96,sky:['#35123f','#a24a86'],f:['#2a1040','#1c0a2d'],gr:'#3a2a20',ac:'#c5348a',pc:'#1a0524',ec:'#b83a9a',wx:3,
 pit:[[24,9],[40,5]],pl:[[22,9.5,3,.5,4,7,0],[40.5,9,2,.5,1,2,0],[60,2,2,9,0],[55,9.5,3,.5,4,0,-4],[78,1,1,10,5]],
 en:[[2,12,9],[0,18,9],[3,36,6],[4,48,9],[2,52,9],[0,66,9],[4,70,9],[3,74,6],[0,81,9]],it:[['wine',8,9],['rum',73,9],['heart',50,9]],sp:[[34,11,3],[47,11,2]],zn:[],ck:[20,38,64,76],
 dlg:['Vinho: aperte E com ele e as plataformas roxas se movem — leve-as pelo abismo!','O pilar alto só se vence erguendo a plataforma com Telecinese.','Rum + E: atravesse a barreira mágica rosa por 7 segundos!']},
{n:'5 · A Torre da Ressaca',len:112,ax:94,door:109,sky:['#120820','#3a0f4a'],f:['#25103a','#180a28'],gr:'#2b2b3a',ac:'#ff4de0',pc:'#08020f',ec:'#6a40c0',wx:4,
 pit:[[48,9],[64,9],[88,4]],pl:[[62,9.5,3,.5,4,7,0],[88.5,9,2,.5,1,2,0],[42,1,1,10,3],[82,1,1,10,5],[30,8,3,.5,0],[36,7,3,.5,0],[96,8,3,.5,0],[104,8,3,.5,0]],
 en:[[0,6,9],[2,22,9],[4,32,9],[3,38,6],[1,44,9],[2,58,9],[4,76,9],[1,78,9],[3,80,6],[0,84,9]],it:[['heart',20,9],['heart',58,9],['heart',84,9]],sp:[[12,11,10]],zn:[[26,14,0]],ck:[24,44,60,75,92],
 dlg:['A Torre! Aqui tudo se combina: Uísque, Vodka, Cerveja, Tequila, Vinho e Rum.','Os cacos longos pedem Escudo (ou Pulo duplo). O frio pede Vodka.','O Grande Barman: derrote-o pulando na cabeça ou com o soco de Cerveja!']}];
// Chefes: [larg,alt,vida]
const BS=[[84,140,6],[120,118,8],[130,120,10],[110,165,12],[150,170,24]];
const BN=['Garrafão Mestre','Rei Barril','Golem de Espuma','Videira Ancestral','O GRANDE BARMAN'];
const BI=['Garrafão Mestre: Aqui ninguém passa sem pagar a conta!','Rei Barril: Vou te rolar até virar suco!','Golem de Espuma: Blub... blub... FRIO!','Videira Ancestral: Suas bebidas serão minhas uvas!','O Grande Barman: Você achou que ia ser fácil? A casa não perdoa!'];
const ES={0:[34,56,1],1:[44,44,1],2:[34,40,1],3:[50,44,2],4:[52,78,4]}; // inimigos: larg,alt,vida

/* ---------- 3. DESENHO DOS MONSTROS (origem = base centro) ---------- */
function ell(x,y,rx,ry,c,lw){X.beginPath();X.ellipse(x,y,rx,ry,0,0,7);X.fillStyle=c;X.fill();if(lw){X.lineWidth=lw;X.strokeStyle=OUT;X.stroke()}}
function eyes(x,y,dx,r,d,ang){for(const s of[-1,1]){ell(x+s*dx,y,r,r*1.2,'#fff',2);ell(x+s*dx+d*r*.4,y+1,r*.5,r*.55,'#111')}
 if(ang){X.lineWidth=3;X.strokeStyle=OUT;X.beginPath();for(const s of[-1,1]){X.moveTo(x+s*(dx+r),y-r*1.5-ang);X.lineTo(x+s*(dx-r),y-r*1.5+ang)}X.stroke()}}
function teeth(x,y,w,h){X.fillStyle='#fff';X.fillRect(x,y,w,h);X.strokeStyle=OUT;X.lineWidth=1.5;X.strokeRect(x,y,w,h);X.beginPath();for(let i=1;i<4;i++){X.moveTo(x+w*i/4,y);X.lineTo(x+w*i/4,y+h)}X.stroke()}
function crown(){X.beginPath();X.moveTo(-9,-58);X.lineTo(-10,-70);X.lineTo(-4,-64);X.lineTo(0,-73);X.lineTo(4,-64);X.lineTo(10,-70);X.lineTo(9,-58);X.closePath();X.fillStyle='#ffd23f';X.fill();X.lineWidth=2;X.strokeStyle=OUT;X.stroke()}
// Garrafa ambulante: vidro, rótulo com cara, tampa, braços e pernas animadas
function drBottle(t,c,d){const w=sn(t*.3)*5;X.lineJoin='round';X.lineWidth=2.5;X.strokeStyle=OUT;
 [-1,1].forEach(s=>{X.fillStyle='#3a2414';X.fillRect(s*8-3,-10,6,10);ell(s*8+s*w,-1,7,3.5,'#2a1a10',2)});
 [-1,1].forEach(s=>{X.beginPath();X.moveTo(s*14,-26);X.lineTo(s*22,-18+s*w*.4);X.stroke();ell(s*23,-17+s*w*.4,4,4,'#e8b78a',2)});
 X.beginPath();X.moveTo(-15,-9);X.quadraticCurveTo(-19,-32,-6,-40);X.lineTo(-6,-52);X.lineTo(6,-52);X.lineTo(6,-40);X.quadraticCurveTo(19,-32,15,-9);X.quadraticCurveTo(0,-4,-15,-9);X.closePath();
 X.fillStyle=c;X.fill();X.stroke();X.fillStyle='#efe0b0';X.fillRect(-14,-32,28,15);X.strokeRect(-14,-32,28,15);
 X.fillStyle='rgba(255,255,255,.45)';X.fillRect(-12,-38,3,26);ell(0,-55,8,4,'#c33',2);eyes(0,-26,6,3.6,d,2);teeth(-6,-20,12,4)}
// Barril explosivo: aduelas, aros metálicos, cara furiosa e pavio aceso
function drBarrel(t,fz,d){const fl=fz&&(t>>2&1);X.lineWidth=2.5;X.strokeStyle=OUT;X.lineJoin='round';
 ell(-12,-2,8,4,'#2a1a10',2);ell(12,-2,8,4,'#2a1a10',2);
 X.beginPath();X.moveTo(-19,-5);X.bezierCurveTo(-27,-16,-27,-32,-19,-44);X.lineTo(19,-44);X.bezierCurveTo(27,-32,27,-16,19,-5);X.closePath();
 X.fillStyle=fl?'#e33':'#9a5a28';X.fill();X.stroke();X.lineWidth=1.2;X.beginPath();[-12,-4,4,12].forEach(i=>{X.moveTo(i*1.3,-44);X.lineTo(i*1.6,-5)});X.stroke();
 X.lineWidth=2.5;X.fillStyle='#6d7380';[-37,-12].forEach(y=>{X.fillRect(-25,y,50,6);X.strokeRect(-25,y,50,6)});
 eyes(0,-26,7,4.5,d,4);teeth(-8,-18,16,6);X.strokeStyle='#5a3a1a';X.beginPath();X.moveTo(0,-44);X.quadraticCurveTo(8,-52,3,-58);X.stroke();
 const q=4+(t%6)/3;ell(3,-60,q,q,'#ffb020')}
// Copo possuído: vidro, líquido, espuma, canudo, alça, dentes
function drCup(t,g,d,c){if(!g)X.scale(.88,1.14);X.lineWidth=2.5;X.strokeStyle=OUT;X.lineJoin='round';
 ell(-8,-1,7,3.5,'#2a1a10',2);ell(8,-1,7,3.5,'#2a1a10',2);X.beginPath();X.arc(18,-22,8,-1.4,1.4);X.lineWidth=4;X.stroke();X.lineWidth=2.5;
 X.beginPath();X.moveTo(-17,-40);X.lineTo(-13,-5);X.lineTo(13,-5);X.lineTo(17,-40);X.closePath();X.fillStyle='rgba(200,235,255,.85)';X.fill();X.stroke();
 X.beginPath();X.moveTo(-16,-30);X.lineTo(16,-30);X.lineTo(13,-5);X.lineTo(-13,-5);X.closePath();X.fillStyle=c;X.fill();
 ell(-9,-40,8,5,'#fff',2);ell(2,-43,9,6,'#fff',2);ell(11,-40,6,4,'#fff',2);
 X.strokeStyle='#e33';X.lineWidth=3;X.beginPath();X.moveTo(6,-44);X.lineTo(14,-62);X.stroke();eyes(0,-24,6,4,d,3);teeth(-7,-15,14,5)}
// Criatura de espuma: nuvem de bolhas com olhos e pingos
function drFoam(t,d){[[-14,-20,14],[10,-24,16],[0,-34,15],[-8,-10,12],[14,-10,11]].forEach(([x,y,r],i)=>ell(x,y+sn(t*.08+i)*2,r,r,'#f4fbff',2.5));
 [[-8,-30,3],[12,-30,2.5],[-18,-14,2]].forEach(([x,y,r])=>ell(x,y,r,r,'rgba(160,210,255,.8)',1.5));
 [-10,6].forEach((x,i)=>ell(x,2+sn(t*.15+i*2)*3,3,5,'#e8f6ff',1.5));
 eyes(0,-22,7,5,d,0);X.fillStyle='#552';X.beginPath();X.arc(0,-14,5,0,3.14);X.fill()}
// Guardião: garrafa de armadura, elmo com pluma, escudo e clava
function drGuard(t,d,c){const w=sn(t*.2)*4;X.lineWidth=3;X.strokeStyle=OUT;X.lineJoin='round';
 [-1,1].forEach(s=>{X.fillStyle='#555a66';X.fillRect(s*10-6,-18,12,16);ell(s*10+s*w,-2,10,4,'#333',2)});
 X.beginPath();X.moveTo(-22,-20);X.quadraticCurveTo(-26,-46,-10,-54);X.lineTo(10,-54);X.quadraticCurveTo(26,-46,22,-20);X.closePath();X.fillStyle=c;X.fill();X.stroke();
 X.fillStyle='#8b93a3';X.fillRect(-24,-40,48,8);X.strokeRect(-24,-40,48,8);[-1,1].forEach(s=>ell(s*24,-50,10,8,'#9aa3b5',2));
 X.beginPath();X.arc(0,-62,15,Math.PI,0);X.lineTo(15,-52);X.lineTo(-15,-52);X.closePath();X.fillStyle='#aab2c3';X.fill();X.stroke();
 X.fillStyle='#220';X.fillRect(-12,-62,24,6);ell(-5,-59,2.5,2.5,'#f33');ell(5,-59,2.5,2.5,'#f33');
 X.beginPath();X.moveTo(0,-77);X.quadraticCurveTo(14+w,-92,24,-72);X.quadraticCurveTo(10,-76,0,-70);X.fillStyle='#d22';X.fill();X.stroke();
 ell(-d*20,-30,12,16,'#7a5a2a',3);X.fillStyle='#ffd23f';X.fillRect(-d*20-2,-40,4,20);X.fillRect(-d*20-8,-32,16,4);
 X.save();X.translate(d*26,-34);X.rotate(d*(.6+sn(t*.2)*.3));X.fillStyle='#7a4a1a';X.fillRect(-3,-26,6,28);X.strokeRect(-3,-26,6,28);ell(0,-30,7,9,'#6a3a12',2.5);X.restore()}
// O Grande Barman: cartola, bigode, colete, gravata borboleta e coqueteleira
function drBarman(t){X.translate(0,sn(t*.05)*6);X.lineWidth=4;X.strokeStyle=OUT;X.lineJoin='round';
 X.beginPath();X.moveTo(-60,0);X.quadraticCurveTo(-72,-70,-40,-100);X.lineTo(40,-100);X.quadraticCurveTo(72,-70,60,0);X.closePath();X.fillStyle='#2b1a52';X.fill();X.stroke();
 X.beginPath();X.moveTo(-22,-100);X.lineTo(22,-100);X.lineTo(0,-30);X.closePath();X.fillStyle='#f3ecff';X.fill();X.stroke();
 [-60,-45,-30].forEach(y=>ell(0,y,3,3,'#d11f4a'));X.fillStyle='#d11f4a';X.beginPath();X.moveTo(0,-96);X.lineTo(-20,-108);X.lineTo(-20,-86);X.closePath();X.moveTo(0,-96);X.lineTo(20,-108);X.lineTo(20,-86);X.closePath();X.fill();X.stroke();
 X.lineWidth=14;X.strokeStyle='#2b1a52';X.beginPath();X.moveTo(-50,-92);X.lineTo(-72,-85);X.moveTo(50,-92);X.lineTo(76,-130+sn(t*.1)*10);X.stroke();X.lineWidth=4;X.strokeStyle=OUT;
 ell(-74,-84,10,10,'#d9a07a',3);ell(77,-132+sn(t*.1)*10,10,10,'#d9a07a',3);
 X.save();X.translate(-76,-92);X.rotate(sn(t*.1)*.3);X.fillStyle='#c8ccd8';X.beginPath();X.moveTo(-10,0);X.lineTo(10,0);X.lineTo(14,-45);X.lineTo(-14,-45);X.closePath();X.fill();X.stroke();X.fillRect(-8,-58,16,13);X.strokeRect(-8,-58,16,13);X.restore();
 ell(0,-134,40,38,'#d9a07a',4);X.fillStyle='#1a1030';X.fillRect(-28,-196,56,44);X.strokeRect(-28,-196,56,44);ell(0,-152,48,8,'#1a1030',4);X.fillStyle='#d11f4a';X.fillRect(-28,-166,56,10);
 eyes(0,-138,15,8,0,7);ell(-15,-138,3,4,'#ff4de0');ell(15,-138,3,4,'#ff4de0');
 X.fillStyle='#111';X.beginPath();X.moveTo(0,-124);X.quadraticCurveTo(-30,-112,-44,-128);X.quadraticCurveTo(-26,-136,0,-130);X.quadraticCurveTo(26,-136,44,-128);X.quadraticCurveTo(30,-112,0,-124);X.fill();X.stroke();
 teeth(-12,-116,24,9)}
function icon(k,x,y,s){X.save();X.translate(x,y);X.scale(s,s);X.lineWidth=2;X.strokeStyle=OUT;const c=D[k].c;
 if(k=='beer'){X.fillStyle=c;X.fillRect(-9,-14,18,24);X.strokeRect(-9,-14,18,24);X.beginPath();X.arc(11,-2,7,-1.5,1.5);X.stroke();ell(-6,-15,5,4,'#fff');ell(2,-17,6,5,'#fff');ell(8,-14,4,4,'#fff')}
 else{const w={wine:7,vodka:6,whisky:10,tequila:8,champagne:8,rum:9}[k];X.beginPath();X.moveTo(-w,10);X.lineTo(-w,-4);X.quadraticCurveTo(-w,-8,-3,-12);X.lineTo(-3,-20);X.lineTo(3,-20);X.lineTo(3,-12);X.quadraticCurveTo(w,-8,w,-4);X.lineTo(w,10);X.closePath();
  X.fillStyle=c;X.fill();X.stroke();X.fillStyle='#f5e6c0';X.fillRect(-w+1,-2,2*w-2,8);X.fillStyle=k=='champagne'?'#ffd23f':'#222';X.fillRect(-3,-24,6,5);ell(0,2,2,2,'#c33');X.fillStyle='rgba(255,255,255,.5)';X.fillRect(-w+2,-8,2,12)}
 X.restore()}

/* ---------- 4. LÓGICA ---------- */
let lv=0,L,P,pls=[],ens=[],its=[],shots=[],parts=[],cks=[],boss=null,bossDown=false,bossActive=false,cam=0,frame=0,mode='menu',
 score=0,lives=5,got=[],resp={x:80,y:380},msgs=[],msgT=0,fade=0,shake=0,tkOn=false,keys={},vic=0,lt=0;
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const say=t=>{if(!msgs.length)msgT=280;msgs.push(t)};
const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
const sv=()=>ls.set('zedose',JSON.stringify({lv,score,lives,got,rx:resp.x}));
const mk=(x,y,w,h,t,dx,dy,g)=>({x:x*T,y:y*T,w:w*T,h:h*T,t:t||0,ox:x*T,oy:y*T,dx:(dx||0)*T,dy:(dy||0)*T,mx:0,my:0,g,ph:0,k:0});
const zone=k=>L.zn.some(([x,w,t])=>t==k&&P.x+15>x*T&&P.x+15<(x+w)*T);
function spawn(t,x,y){const[w,h,hp]=ES[t];ens.push({t,x,y,w,h,hp,vx:0,vy:0,dir:-1,tm:0,by:y,fuse:0,flash:0,ic:0,g:0,on:null})}
function load(i,rx){lv=i;L=LV[i];pls=[];ens=[];its=[];shots=[];parts=[];boss=null;bossDown=false;bossActive=false;tkOn=false;msgs=[];lt=0;
 let x=0;[...L.pit].sort((a,b)=>a[0]-b[0]).forEach(([p,w])=>{if(p>x)pls.push(mk(x,11,p-x,5,0,0,0,1));x=p+w});pls.push(mk(x,11,L.len-x,5,0,0,0,1));
 L.pl.forEach(a=>pls.push(mk(...a)));L.en.forEach(([t,x,y])=>spawn(t,x*T,y*T));
 L.it.forEach(([k,x,y])=>its.push({k,x:x*T,y:y*T,ph:R()*6}));
 pls.filter(p=>!p.g&&p.t<3&&p.w>=T*2).forEach(p=>{for(let j=0;j<2;j++)its.push({k:'cap',x:p.x+p.w*(.3+.4*j),y:p.y-36,ph:j})});
 for(let x=6;x<L.len-8;x+=5)if(!L.pit.some(([p,w])=>x>=p-1&&x<=p+w+1)&&!L.pl.some(a=>a[4]>=3&&ab(a[0]-x)<2))its.push({k:'cap',x:x*T,y:GY-36,ph:x});
 const sx=rx!=null?rx:2*T;cks=L.ck.map(x=>({x,got:rx!=null&&x*T<=rx}));resp={x:sx,y:GY-62};
 P={x:sx,y:GY-62,w:30,h:60,vx:0,vy:0,face:1,g:0,hp:3,inv:60,en:100,dash:0,jumps:0,coy:0,buf:0,dead:0,hurt:0,vodka:0,whisky:0,rum:0,cold:0,pow:0,cel:0,on:null,sel:got.length?got[got.length-1]:null};
 cam=Math.max(0,sx-300);mode='play';fade=0;L.dlg.forEach(say);['menu','pause','end'].forEach(i=>$(i).classList.add('hide'))}
function burst(o,c,n){const cx=o.x+(o.w||0)/2,cy=o.y+(o.h||0)/2;for(let i=0;i<n;i++){const a=R()*6.28,s=1+R()*5;parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,l:30+R()*30,m:60,c,s:2+R()*4,g:.12})}}
function mv(b){const so=pls.filter(p=>!p.off);b.wall=0;if(b.on){b.x+=b.on.mx;b.y+=b.on.my}
 b.x+=b.vx;for(const s of so)if(ov(b,s)){if(b.vx>0)b.x=s.x-b.w;else if(b.vx<0)b.x=s.x+s.w;b.wall=1}
 b.y+=b.vy;b.g=0;b.on=null;for(const s of so)if(ov(b,s)){if(b.vy>=0){b.y=s.y-b.h;b.g=1;b.on=s}else b.y=s.y+s.h;b.vy=0}}
function ground(e){const px=e.x+e.w/2+e.dir*(e.w/2+6),py=e.y+e.h+6;return pls.some(s=>!s.off&&px>s.x&&px<s.x+s.w&&py>s.y&&py<s.y+s.h)}
function updPl(p){const ox=p.x,oy=p.y;
 if(p.t==1){p.ph+=.02;const k=.5-.5*Math.cos(p.ph);p.x=p.ox+p.dx*k;p.y=p.oy+p.dy*k}
 if(p.t==4){p.k+=Math.max(-.012,Math.min(.012,(tkOn?1:0)-p.k));p.x=p.ox+p.dx*p.k;p.y=p.oy+p.dy*p.k}
 p.mx=p.x-ox;p.my=p.y-oy}
function hurt(n){const p=P;if(p.inv>0||p.dead||p.dash>0)return;if(p.whisky>0){burst(p,'#ffb040',8);p.inv=20;snd('no');return}
 p.hp-=n;p.inv=90;p.hurt=30;p.vy=-8;p.vx=-p.face*5;shake=8;snd('hurt');burst(p,'#ff5030',12);if(p.hp<=0)kill()}
function kill(){if(P.dead)return;P.dead=100;P.vy=-11;P.vx=0;burst(P,'#fff',20);snd('hurt')}
function die(){lives--;if(lives<=0){end(false);return}P.x=resp.x;P.y=resp.y;P.hp=3;P.dead=0;P.inv=120;P.vx=P.vy=0;P.cold=0;shots=[];
 // reabre a arena: evita ficar trancado do lado de fora; o chefe reinicia (se já morreu, continua morto)
 pls=pls.filter(p=>!p.arena);if(!bossDown){bossActive=false;boss=null;ens=ens.filter(e=>e.x<L.ax*T)}else bossActive=true;sv()}
function useAb(){const p=P,k=p.sel;if(!k||!got.includes(k)||k=='champagne')return;const d=D[k];if(p.en<d.cost){snd('no');return}p.en-=d.cost;p.cel=20;
 if(k=='beer'){const hb={x:p.face>0?p.x+p.w:p.x-110,y:p.y-10,w:110,h:p.h+20};
  pls.slice().forEach(w=>{if(w.t==3&&ov(hb,w)){pls.splice(pls.indexOf(w),1);burst(w,'#c9a070',40);score+=50;shake=14;snd('boom')}});
  ens.forEach(e=>{if(ov(hb,e))hitE(e,2)});if(boss&&!boss.dead&&ov(hb,boss)&&!boss.inv)hitB(2);
  for(let i=0;i<14;i++)parts.push({x:hb.x+R()*110,y:p.y+R()*60,vx:p.face*(3+R()*4),vy:-R()*2,l:20,m:20,c:'#ffd23f',s:5,g:0});snd('punch')}
 if(k=='wine'){tkOn=!tkOn;burst(p,'#c04bff',30);snd('magic')}
 if(k=='vodka'){p.vodka=d.dur;burst(p,'#bff',25);snd('magic')}if(k=='whisky'){p.whisky=d.dur;snd('magic')}if(k=='rum'){p.rum=d.dur;burst(p,'#ff8ae0',25);snd('magic')}
 if(k=='tequila'){p.dash=14;p.inv=Math.max(p.inv,14);burst(p,'#c9e65a',20);snd('boom')}}
function updP(){const p=P;
 if(p.dead){p.vy+=.6;p.y+=p.vy;if(--p.dead==0)die();return}
 const l=keys.ArrowLeft||keys.KeyA,r=keys.ArrowRight||keys.KeyD,run=keys.ShiftLeft||keys.ShiftRight,jh=keys.Space||keys.ArrowUp||keys.KeyW;
 p.en=Math.min(100,p.en+.14);['vodka','whisky','rum','inv','hurt','buf','coy','pow','cel'].forEach(k=>{if(p[k]>0)p[k]--});
 if(p.dash>0){p.dash--;p.vx=p.face*13;p.vy=Math.min(p.vy,0)*.5-.3;parts.push({x:p.x+15,y:p.y+30,vx:0,vy:0,l:15,m:15,c:'#c9e65a',s:8,g:0})}
 else{const d=(r?1:0)-(l?1:0),sp=run?6.4:4.2,ice=p.g&&!p.vodka&&((p.on&&p.on.t==2)||zone(1));if(d)p.face=d;
  p.vx+=(d*sp-p.vx)*(ice?.03:p.g?.3:.16);p.vy=Math.min(p.vy+.62,14)}
 if(p.g){p.coy=7;p.jumps=0}
 if(p.buf>0&&p.coy>0){p.vy=-14.6;p.coy=0;p.buf=0;p.jumps=1;snd('jump')}
 else if(p.buf>0&&!p.g&&got.includes('champagne')&&p.jumps<2){p.vy=-13.2;p.jumps=2;p.buf=0;burst({x:p.x+15,y:p.y+60},'#fff0a0',12);snd('jump2')}
 if(!jh&&p.vy<-5&&p.dash<=0)p.vy=-5;
 mv(p);p.x=Math.max(0,Math.min(L.len*T-p.w,p.x));if(p.y>H+80)kill();
 // hazards
 L.sp.forEach(([x,y,w])=>{if(ov(p,{x:x*T+4,y:y*T-18,w:w*T-8,h:18}))hurt(1)});
 if(zone(0)&&!p.vodka){if(++p.cold>60){p.cold=0;p.hp--;p.hurt=20;burst(p,'#bff',12);snd('hurt');if(p.hp<=0)kill()}}else p.cold=Math.max(0,p.cold-2)}
function hitE(e,n){if(e.ic>0)return;e.hp-=n;e.flash=8;e.ic=10;snd('hit');if(e.hp<=0){e.dead=1;score+=e.t==4?300:100;burst(e,e.t==3?'#fff':'#ffd23f',22)}}
function boom(e){e.dead=1;burst(e,'#ff8a1c',50);burst(e,'#ffe',20);shake=16;snd('boom');if(ab(P.x-e.x)<95&&ab(P.y-e.y)<95)hurt(1)}
function updEn(e){e.tm++;if(e.flash>0)e.flash--;if(e.ic>0)e.ic--;const dx=P.x-e.x,near=ab(dx)<420&&ab(P.y-e.y)<220;
 if(e.t==3){if(near)e.x+=sg(dx)*.8;e.y=e.by+sn(e.tm*.05)*20;e.dir=sg(dx)||1}
 else{
  if(e.t==0||e.t==4){const ch=e.t==4&&near&&ab(dx)<320;if(ch)e.dir=sg(dx);else if(e.wall||!ground(e))e.dir*=-1;e.vx=ch&&!ground(e)?0:e.dir*(ch?3.6:1.1)}
  if(e.t==1){if(e.fuse){if(--e.fuse<=0){boom(e);return}e.vx*=.9}else if(near&&ab(dx)<320){e.dir=sg(dx);e.vx=Math.max(-3.2,Math.min(3.2,e.vx+e.dir*.3))}else e.vx*=.9}
  if(e.t==2&&e.g){e.vx*=.7;if(e.tm%75==0&&near){e.vy=-11;e.vx=sg(dx)*3.2;e.dir=sg(dx)}}
  e.vy=Math.min(e.vy+.62,14);mv(e);if(e.y>H+100)e.dead=1}
 if(!P.dead&&ov(P,e)){const st=P.vy>1&&P.y+P.h-e.y<28;
  if(P.dash>0)hitE(e,1);else if(st){hitE(e,1);P.vy=-11.5;P.jumps=1;snd('stomp')}
  else if(e.t==1){if(!e.fuse){e.fuse=45;snd('fuse')}}else hurt(1)}}
function shoot(x,y,vx,vy,k,g){shots.push({x,y,vx,vy,k,g:g||0,r:k=='wave'?18:11,tm:0})}
function rain(k){shoot(L.ax*T+T+R()*(L.door-L.ax-2)*T,-20,0,0,k,.13)}
function hitB(n){boss.hp-=n;boss.inv=50;boss.flash=10;shake=12;snd('hit');burst(boss,'#ffd23f',20);
 if(boss.hp<=0){boss.dead=1;bossDown=true;score+=1000;burst(boss,'#fff',80);burst(boss,'#ff8a1c',60);shake=30;snd('boom');shots=[];
  if(lv==4){vic=180;say('O Grande Barman: Impossível... a conta... foi paga...')}else say('Chefe derrotado! A porta de saída foi liberada!')}}
function updBoss(b){b.tm++;if(b.inv>0)b.inv--;if(b.flash>0)b.flash--;if(b.dead)return;
 const dx=P.x-b.x,d=sg(dx)||1,cx=b.x+b.w/2;b.dir=d;
 if(lv==0){b.vx=d*1.3;if(b.tm%100==0)shoot(cx,GY-30,d*5,0,'bt');if(b.tm%170==0&&b.g)b.vy=-12}
 if(lv==1){b.vx=d*1.5;if(b.tm%150==0&&ens.length<5)spawn(1,b.x+d*90,b.y);if(b.tm%210==0&&b.g){b.vy=-13;b.land=1}if(b.land&&b.g){b.land=0;shoot(cx,GY-18,-4,0,'wave');shoot(cx,GY-18,4,0,'wave');shake=12}}
 if(lv==2){b.x+=d*1.1;b.y=b.by+sn(b.tm*.04)*30;if(b.tm%80==0)for(let i=-1;i<2;i++){const a=Math.atan2(P.y-b.y,dx)+i*.3;shoot(cx,b.y+60,Math.cos(a)*4.5,Math.sin(a)*4.5,'bub')}if(b.tm%170==0&&ens.length<4)spawn(3,b.x,b.y)}
 if(lv==3){b.vx=d*1;if(b.tm%38==0)rain('grape');if(b.tm%200==0&&ens.length<4)spawn(2,b.x-d*60,b.y);if(b.tm%180==0&&b.g)b.vy=-12}
 if(lv==4){const ph=b.hp>16?0:b.hp>8?1:2;b.x+=d*.8*(1+ph*.4);b.y=b.by+sn(b.tm*.04)*10;if(b.tm%[70,50,34][ph]==0)rain('bt');
  if(b.tm%170==0){shoot(cx,GY-18,-5,0,'wave');if(ph>0)shoot(cx,GY-18,5,0,'wave')}if(ph>0&&b.tm%240==0&&ens.length<4)spawn(2,b.x-40,GY-100);
  if(ph>1&&b.tm%90==0){const a=Math.atan2(P.y-b.y-40,P.x-cx);shoot(cx,b.y+40,Math.cos(a)*5,Math.sin(a)*5,'bt')}}
 if(lv==0||lv==1||lv==3){b.vy=Math.min(b.vy+.62,14);mv(b)}
 b.x=Math.max((L.ax+1)*T,Math.min((L.door-1)*T-b.w,b.x));
 if(!P.dead&&ov(P,b)){if(P.dash>0){if(!b.inv)hitB(1)}else if(P.vy>1&&P.y+P.h<b.y+50){if(!b.inv)hitB(1);P.vy=-13;P.jumps=1}else hurt(1)}}
function startBoss(){bossActive=true;const wl=mk(L.ax-1,0,1,11,0);wl.arena=1;pls.push(wl);const[w,h,hp]=BS[lv];
 boss={x:(L.door-6)*T,y:GY-h-(lv==2?70:lv==4?10:0),w,h,hp,max:hp,vx:0,vy:0,tm:0,inv:0,flash:0,dir:-1,g:0,on:null,dead:0};boss.by=boss.y;say(BI[lv]);snd('boom')}
function update(){frame++;lt++;
 if(mode=='done'){fade+=.02;if(fade>=1)nextLevel();return}
 if(vic>0&&--vic==0){end(true);return}
 pls.forEach(p=>p.off=p.t==5&&P.rum>0);pls.forEach(updPl);updP();ens.forEach(updEn);ens=ens.filter(e=>!e.dead);
 if(!bossActive&&P.x>L.ax*T)startBoss();if(boss)updBoss(boss);
 // itens
 its=its.filter(i=>{const z=i.k=='cap'?24:32;if(P.dead||!ov(P,{x:i.x,y:i.y,w:z,h:z}))return true;
  if(i.k=='cap'){score+=10;snd('coin');return false}
  if(i.k=='heart'){if(P.hp<3)P.hp++;else score+=100;snd('power');return false}
  got.push(i.k);P.sel=i.k;P.pow=90;P.en=100;score+=500;burst(i,D[i.k].c,60);snd('power');shake=10;say('★ '+D[i.k].n+' coletada! '+D[i.k].p);sv();return false});
 its=its.filter(i=>got.includes(i.k)?(i.k=='cap'||i.k=='heart'):true);
 cks.forEach(c=>{if(!c.got&&P.x>c.x*T){c.got=true;resp={x:c.x*T,y:GY-62};burst({x:c.x*T,y:GY-60},'#ffd23f',25);say('Checkpoint salvo!');snd('coin');sv()}});
 shots.forEach(s=>{s.tm++;s.vy+=s.g;s.x+=s.vx;s.y+=s.vy;if(s.k=='wave')s.y=GY-18;const hb={x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2};
  if(!P.dead&&ov(hb,P)){if(P.whisky>0||P.dash>0)burst(s,'#fff',8);else hurt(1);s.dead=1}
  if((s.y>GY&&s.k!='wave')||s.tm>320){s.dead=1;burst(s,'#fff',5)}});shots=shots.filter(s=>!s.dead);
 // porta de saída
 const dr={x:L.door*T,y:GY-100,w:60,h:100};if(bossDown&&lv<4&&ov(P,dr)){mode='done';fade=0;say('Fase concluída!')}
 // câmera, mensagens, partículas, clima
 cam+=(Math.max(0,Math.min(L.len*T-W,P.x-W*.4))-cam)*.1;if(shake>0)shake-=.8;if(msgs.length&&--msgT<=0){msgs.shift();msgT=280}
 for(let i=0;i<2&&R()<.6;i++){const w=L.wx,x=cam+R()*W;parts.push(w==0?{x,y:H,vx:R()-.5,vy:-1-R(),l:100,m:100,c:'#ffb040',s:2,g:0}:w==1?{x,y:H,vx:0,vy:-1-R(),l:120,m:120,c:'rgba(255,255,255,.7)',s:3+R()*4,g:0}:
  w==2?{x,y:-5,vx:-1,vy:1+R()*2,l:300,m:300,c:'#fff',s:2+R()*2,g:0}:w==3?{x,y:H*R(),vx:R()-.5,vy:R()-.5,l:100,m:100,c:'#e060ff',s:2,g:0}:{x,y:-5,vx:0,vy:3+R()*3,l:100,m:100,c:'#ff4de0',s:2,g:0})}
 parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.l--});parts=parts.filter(p=>p.l>0)}
function nextLevel(){if(lv==4){end(true);return}const l=lv+1;load(l);sv()}
function end(win){mode='over';$('eT').textContent=win?'🏆 VITÓRIA!':'GAME OVER';
 $('eP').textContent=win?'Zé Dose derrotou O Grande Barman, a destilaria foi selada e Bebedolândia voltou ao normal (quase). Pontos: '+score:'Zé caiu em coma de ressaca... Pontos: '+score;$('end').classList.remove('hide')}

/* ---------- 5. DESENHO ---------- */
function bg(){const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,L.sky[0]);g.addColorStop(1,L.sky[1]);X.fillStyle=g;X.fillRect(0,0,W,H);
 for(let l=0;l<2;l++){const off=-(cam*(.2+l*.25))%400;X.fillStyle=L.f[l];for(let i=-1;i<4;i++){const x=off+i*400+l*130;
  if(lv==0){if(!l){X.fillRect(x+60,60,90,150);X.fillStyle='rgba(255,220,150,.2)';X.beginPath();X.moveTo(x+60,60);X.lineTo(x+150,60);X.lineTo(x+260,440);X.lineTo(x-40,440);X.fill()}else{X.fillRect(x,300,320,10);for(let j=0;j<7;j++){X.fillRect(x+10+j*44,260,16,40);X.fillRect(x+14+j*44,246,8,16)}}}
  if(lv==1){if(!l){X.beginPath();X.ellipse(x+150,GY,230,150,0,Math.PI,0);X.fill()}else{ell(x+80,GY-60,60,70,'#a8651a');X.fillStyle='#6b3d10';X.fillRect(x+20,GY-85,120,8);X.fillRect(x+20,GY-40,120,8)}}
  if(lv==2){X.beginPath();X.moveTo(x-60,GY);X.lineTo(x+120+l*40,GY-250+l*90);X.lineTo(x+300,GY);X.fill();X.fillStyle='#fff';X.beginPath();X.moveTo(x+120+l*40,GY-250+l*90);X.lineTo(x+90+l*40,GY-190+l*90);X.lineTo(x+150+l*40,GY-190+l*90);X.fill()}
  if(lv==3){X.lineWidth=14;X.strokeStyle=L.f[l];X.beginPath();X.moveTo(x,GY);X.bezierCurveTo(x+80,GY-200,x-60,GY-300,x+70,H*0);X.stroke();for(let j=0;j<6;j++)ell(x+30+(j%3)*14,GY-120-Math.floor(j/3)*14-l*40,9,9,l?'#5a1a70':'#7a2a90')}
  if(lv==4){X.fillRect(x+40,150-l*30,70,GY);X.beginPath();X.moveTo(x+40,150-l*30);X.lineTo(x+75,60-l*30);X.lineTo(x+110,150-l*30);X.fill();ell(x+75,200-l*30,8,8,'#ff4de0')}}}
 if(lv==4&&frame%180<6){X.fillStyle='rgba(255,100,255,.25)';X.fillRect(0,0,W,H)}}
function drawPl(p){const x=p.x,y=p.y,w=p.w,h=p.h;if(x+w<cam-50||x>cam+W+50)return;
 if(p.g){X.fillStyle=L.gr;X.fillRect(x,y,w,h);X.fillStyle=L.ac;X.fillRect(x,y,w,8);X.fillStyle='rgba(0,0,0,.2)';for(let i=0;i<w/T;i++){X.fillRect(x+i*T,y+8,2,h);ell(x+i*T+20,y+30+(i*37%60),9,6,'rgba(0,0,0,.2)')}return}
 if(p.t==3){X.fillStyle='#8a6a50';X.fillRect(x,y,w,h);X.fillStyle='#6a4a36';for(let j=0;j<h/20;j++)X.fillRect(x,y+j*20,w,2);X.strokeStyle='rgba(255,210,80,'+(.6+.4*sn(frame*.1))+')';X.lineWidth=3;
  X.beginPath();for(let j=0;j<h/40;j++){X.moveTo(x+5,y+j*40+5);X.lineTo(x+20,y+j*40+18);X.lineTo(x+10,y+j*40+30);X.lineTo(x+30,y+j*40+40)}X.stroke();X.strokeStyle=OUT;X.strokeRect(x,y,w,h);return}
 if(p.t==5){if(p.off){X.fillStyle='rgba(255,100,220,.12)';X.fillRect(x,y,w,h)}else{const g=X.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(255,80,220,.35)');g.addColorStop(.5,'rgba(255,160,255,.8)');g.addColorStop(1,'rgba(255,80,220,.35)');X.fillStyle=g;X.fillRect(x,y,w,h);X.fillStyle='#fff';for(let j=0;j<h/40;j++)X.fillRect(x+8+sn(frame*.1+j)*8,y+j*40+((frame*2+j*13)%40),4,10)}return}
 const c=['#7a4b22','#b87333','rgba(190,235,255,.92)','','#6a2fa0'][p.t];X.fillStyle=c;X.fillRect(x,y,w,h);X.strokeStyle=OUT;X.lineWidth=2;X.strokeRect(x,y,w,h);
 X.fillStyle='rgba(255,255,255,.35)';X.fillRect(x+2,y+2,w-4,4);
 if(p.t==4){X.fillStyle='#e0a0ff';for(let j=0;j<w/T;j++)ell(x+j*T+20,y+h/2,4,4,'#e0a0ff');if(h>T){X.fillStyle='#4a1a78';X.fillRect(x,y,w,h)}}
 if(p.t==1)for(let j=0;j<w/T;j++)ell(x+j*T+20,y+h/2,3,3,'#5a3010');
 if(p.t==0&&h<T)for(let j=1;j<w/T;j++)X.fillRect(x+j*T,y,2,h)}
function drawEn(e){X.save();X.translate(e.x+e.w/2,e.y+e.h);if(e.flash>0)X.filter='brightness(2.5)';const d=e.dir||1;
 if(e.t==0)drBottle(e.tm,L.ec,d);if(e.t==1)drBarrel(e.tm,e.fuse,d);if(e.t==2)drCup(e.tm,e.g,d,L.ec);if(e.t==3){X.translate(0,6);drFoam(e.tm,d)}if(e.t==4)drGuard(e.tm,d,L.ec);X.restore()}
function drawBoss(b){X.save();X.translate(b.x+b.w/2,b.y+b.h);if(b.flash>0&&frame%4<2)X.filter='brightness(2.8)';if(b.dead)X.globalAlpha=Math.max(0,1-(frame%1)*0);const d=b.dir,t=b.tm;
 if(lv==0){X.scale(2.4,2.4);drBottle(t,'#3f9a4a',d);crown()}
 if(lv==1){X.scale(2.7,2.7);drBarrel(t,b.inv>0,d);crown()}
 if(lv==2){X.scale(2.9,2.9);drFoam(t,d);X.fillStyle='#bfe9ff';[-12,0,12].forEach(x=>{X.beginPath();X.moveTo(x-5,-48);X.lineTo(x,-66);X.lineTo(x+5,-48);X.fill()})}
 if(lv==3){X.scale(2.1,2.1);drGuard(t,d,'#7b2d8e');X.strokeStyle='#2a7a2a';X.lineWidth=4;for(let i=-1;i<2;i+=2){X.beginPath();X.moveTo(i*20,-10);X.bezierCurveTo(i*40,-30,i*10,-50,i*30,-70);X.stroke()}}
 if(lv==4){drBarman(t)}X.restore()}
function drawShot(s){X.save();X.translate(s.x,s.y);
 if(s.k=='bt'){X.rotate(s.tm*.25);X.scale(.6,.6);X.translate(0,28);drBottle(0,'#3f9a4a',1)}
 if(s.k=='grape'){ell(0,0,11,11,'#7b2d8e',2);ell(-3,-3,3,3,'rgba(255,255,255,.6)')}
 if(s.k=='wave'){ell(0,0,18,18,'#fff',2);ell(-8,-6,6,6,'#cfeaff',1.5);ell(8,-4,5,5,'#cfeaff',1.5)}
 if(s.k=='bub'){ell(0,0,11,11,'rgba(180,225,255,.7)',2);ell(-3,-3,3,3,'#fff')}X.restore()}
function drawP(){const p=P;let r=S.idle;const m=ab(p.vx)>.5;
 if(p.dead)r=S.dead;else if(p.hurt>0)r=S.hurt;else if(p.pow>0||p.cel>0)r=S.jump;else if(!p.g)r=p.vy<0?S.jump:S.fall;
 else if(m){const run=ab(p.vx)>5,f=(frame/(run?5:8)|0)%2;r=run?(f?S.run1:S.run2):(f?S.walk:S.idle)}
 const al=p.inv>0&&!p.dead&&(frame>>2&1)?.4:p.rum>0?.6:1;
 if(p.whisky>0){ell(p.x+15,p.y+30,40,46,'rgba(255,180,60,'+(.25+.1*sn(frame*.2))+')',3)}
 if(p.vodka>0){ell(p.x+15,p.y+30,36,42,'rgba(160,230,255,.22)',2)}
 spr(r,p.x+15,p.y+p.h+2,SC,p.face<0,al);
 if(p.pow>0){icon(P.sel,p.x+15,p.y-30-(90-p.pow)*.3,1.6);ell(p.x+15,p.y+30,(90-p.pow)*1.2,(90-p.pow)*1.2,'rgba(255,255,255,0)',3)}}
function drawItem(i){const y=i.y+sn(frame*.08+i.ph)*5;
 if(i.k=='cap'){ell(i.x+12,y+12,10,10,'#d9a520',2);ell(i.x+12,y+12,5,5,'#fff2a0');return}
 if(i.k=='heart'){X.font='30px sans-serif';X.fillStyle='#ff3050';X.fillText('♥',i.x,y+28);return}
 const g=X.createRadialGradient(i.x+16,y+16,2,i.x+16,y+16,34);g.addColorStop(0,D[i.k].c+'cc');g.addColorStop(1,'transparent');X.fillStyle=g;X.fillRect(i.x-20,y-20,72,72);icon(i.k,i.x+16,y+18,1.5)}
function draw(){bg();const sh=shake>0?(R()-.5)*shake:0;X.save();X.translate(-Math.round(cam)+sh,sh);
 L.pit.forEach(([p,w])=>{const g=X.createLinearGradient(0,GY,0,H);g.addColorStop(0,L.pc);g.addColorStop(1,'#000');X.fillStyle=g;X.fillRect(p*T,GY,w*T,H-GY+20);
  if(lv==1||lv==2){X.fillStyle=lv==1?'#fff':'#bfe6ff';X.beginPath();X.moveTo(p*T,H);for(let x=0;x<=w*T;x+=10)X.lineTo(p*T+x,GY+30+sn((x+frame*2)*.05)*8);X.lineTo((p+w)*T,H);X.fill()}});
 L.zn.forEach(([x,w,k])=>{const g=X.createLinearGradient(0,0,0,GY);g.addColorStop(0,'rgba(150,220,255,0)');g.addColorStop(1,k?'rgba(255,255,255,.35)':'rgba(120,200,255,.4)');X.fillStyle=g;X.fillRect(x*T,0,w*T,GY)});
 pls.forEach(drawPl);
 L.sp.forEach(([x,y,w])=>{for(let i=0;i<w*2;i++){const sx=x*T+i*20;X.beginPath();X.moveTo(sx,y*T);X.lineTo(sx+10,y*T-22-(i%3)*5);X.lineTo(sx+20,y*T);X.fillStyle='rgba(190,240,230,.9)';X.fill();X.strokeStyle=OUT;X.lineWidth=2;X.stroke();X.fillStyle='#fff';X.fillRect(sx+8,y*T-14,2,8)}});
 cks.forEach(c=>{X.fillStyle='#5a3a1a';X.fillRect(c.x*T,GY-90,6,90);X.fillStyle=c.got?'#ffd23f':'#888';X.beginPath();X.moveTo(c.x*T+6,GY-90);X.lineTo(c.x*T+46,GY-76+sn(frame*.1)*3);X.lineTo(c.x*T+6,GY-62);X.fill();X.strokeStyle=OUT;X.stroke()});
 const dx=L.door*T;X.fillStyle='#4a2a12';X.fillRect(dx-6,GY-110,72,110);X.fillStyle=bossDown?'#ffe28a':'#6b3d1a';X.fillRect(dx,GY-100,60,100);X.strokeStyle=OUT;X.lineWidth=3;X.strokeRect(dx,GY-100,60,100);
 if(bossDown){X.fillStyle='rgba(255,230,120,.3)';X.fillRect(dx-20,GY-130,100,130)}else{X.fillStyle='#bbb';X.fillRect(dx+22,GY-60,16,18);X.strokeRect(dx+22,GY-60,16,18)}
 its.forEach(drawItem);ens.forEach(drawEn);if(boss&&!boss.dead)drawBoss(boss);shots.forEach(drawShot);drawP();
 parts.forEach(p=>{X.globalAlpha=Math.min(1,p.l/(p.m*.5));X.fillStyle=p.c;X.fillRect(p.x,p.y,p.s,p.s)});X.globalAlpha=1;X.restore();
 const vg=X.createRadialGradient(P.x-cam+15,P.y+30,150,P.x-cam+15,P.y+30,640);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,'+(lv==0||lv==3||lv==4?.55:.25)+')');X.fillStyle=vg;X.fillRect(0,0,W,H);
 hud()}
function box(x,y,w,h){X.fillStyle='rgba(25,12,5,.78)';X.strokeStyle='#e0a040';X.lineWidth=3;X.beginPath();X.rect(x,y,w,h);X.fill();X.stroke()}
function hud(){box(8,8,290,88);const fi=P.dead?4:P.hurt>0?3:P.pow>0?5:bossActive&&!bossDown?2:P.hp==1?4:0;spr(S.f[fi],50,84,.25,0);
 X.font='bold 18px Trebuchet MS';X.fillStyle='#ff4060';X.fillText('♥'.repeat(P.hp)+'♡'.repeat(3-P.hp),90,32);X.fillStyle='#ffe9b8';X.fillText('Vidas x'+lives,200,32);
 X.fillText('Pontos '+score,90,54);X.fillText('🍺 '+got.length+'/7',210,54);X.fillStyle='#000';X.fillRect(90,64,190,14);const g=X.createLinearGradient(90,0,280,0);g.addColorStop(0,'#ffd23f');g.addColorStop(1,'#ff6a1a');X.fillStyle=g;X.fillRect(90,64,190*P.en/100,14);X.strokeStyle=OUT;X.strokeRect(90,64,190,14);
 X.font='12px Trebuchet MS';X.fillStyle='#ffe9b8';X.fillText('ENERGIA',92,90);
 DK.forEach((k,i)=>{const x=W-8-(7-i)*46,has=got.includes(k);X.fillStyle=P.sel==k?'rgba(255,210,60,.85)':'rgba(25,12,5,.78)';X.fillRect(x,8,42,54);X.strokeStyle=has?D[k].c:'#555';X.lineWidth=2;X.strokeRect(x,8,42,54);
  if(has)icon(k,x+21,40,1.1);else{X.fillStyle='#777';X.font='bold 20px sans-serif';X.fillText('?',x+15,42)}X.fillStyle='#fff';X.font='11px sans-serif';X.fillText(i+1,x+3,20);
  const tm=P[k];if(tm>0){X.fillStyle=D[k].c;X.fillRect(x,58,42*tm/D[k].dur,4)}});
 X.font='bold 15px Trebuchet MS';X.fillStyle='#ffe9b8';X.textAlign='center';X.fillText(L.n,W/2,24);
 if(P.sel)X.fillText('Poder: '+D[P.sel].n+' ['+D[P.sel].p+']',W/2,H-10);
 if(boss&&!boss.dead){X.fillStyle='#000';X.fillRect(W/2-200,34,400,16);X.fillStyle='#e02a2a';X.fillRect(W/2-200,34,400*boss.hp/boss.max,16);X.strokeStyle='#ffd23f';X.strokeRect(W/2-200,34,400,16);X.fillStyle='#fff';X.font='12px Trebuchet MS';X.fillText(BN[lv],W/2,47)}
 if(msgs.length){box(130,104,700,64);X.fillStyle='#ffe9b8';X.font='bold 16px Trebuchet MS';const t=msgs[0],a=t.length>70?t.lastIndexOf(' ',70):t.length;X.fillText(t.slice(0,a),W/2,132);if(a<t.length)X.fillText(t.slice(a+1),W/2,154)}
 if(lt<120){X.globalAlpha=Math.min(1,(120-lt)/40);X.font='bold 44px Trebuchet MS';X.fillStyle='#ffd23f';X.strokeStyle=OUT;X.lineWidth=6;X.strokeText(L.n,W/2,200);X.fillText(L.n,W/2,200);X.globalAlpha=1}
 X.textAlign='left';if(mode=='done'){X.fillStyle='rgba(0,0,0,'+fade+')';X.fillRect(0,0,W,H)}}

/* ---------- 6. SOM (WebAudio, sem arquivos) ---------- */
let AC;function initAudio(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function tone(f,d,ty,v,f2){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(t+d)}
function snd(k){const m={jump:[300,.1,'square',700],jump2:[500,.12,'triangle',900],stomp:[200,.1,'square',80],hit:[160,.12,'sawtooth',60],punch:[90,.25,'sawtooth',40],magic:[400,.3,'sine',900],coin:[900,.08,'square',1400],power:[300,.5,'triangle',1200],hurt:[220,.25,'sawtooth',70],no:[120,.1,'square',100],boom:[80,.5,'sawtooth',30],fuse:[600,.2,'square',900]}[k];if(m)tone(m[0],m[1],m[2],.1,m[3])}
// Trilha: cada fase tem timbre e escala próprios
const MU=[{b:110,t:'square',s:[0,3,5,3,7,5,3,0]},{b:147,t:'triangle',s:[0,4,7,4,9,7,4,2]},{b:130,t:'sine',s:[0,7,12,7,5,12,10,7]},{b:98,t:'sawtooth',s:[0,3,6,3,0,-2,3,6]},{b:82,t:'sawtooth',s:[0,1,3,0,6,5,3,1]}];
let ms=0;setInterval(()=>{if(!AC||mode!='play')return;const m=MU[lv],n=m.s[ms++%8];tone(m.b*2**(n/12),.2,m.t,.035);if(ms%2)tone(m.b/2,.2,'triangle',.05)},230);

/* ---------- 7. MENUS, ENTRADA E LOOP ---------- */
const show=(i,v)=>$(i).classList.toggle('hide',!v);
function newGame(){score=0;lives=5;got=[];load(0);sv()}
$('bStart').onclick=()=>{initAudio();newGame()};
$('bCont').onclick=()=>{initAudio();const s=JSON.parse(ls.get('zedose')||'null');if(!s)return newGame();score=s.score;lives=s.lives;got=s.got;load(s.lv,s.rx)};
$('bResume').onclick=()=>{mode='play';show('pause',0)};
$('bRetry').onclick=()=>{load(lv,resp.x>80?resp.x:null)};
$('bAgain').onclick=()=>{newGame()};
if(!ls.get('zedose'))$('bCont').style.display='none';
function pause(){if(mode=='play'){mode='pause';show('pause',1)}else if(mode=='pause'){mode='play';show('pause',0)}}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();const first=!keys[e.code];keys[e.code]=1;
 if(e.code=='Escape'&&first)pause();if(mode!='play'||!first)return;
 if(['Space','ArrowUp','KeyW'].includes(e.code))P.buf=8;if(e.code=='KeyE')useAb();
 if(e.code=='KeyQ'&&got.length){P.sel=got[(got.indexOf(P.sel)+1)%got.length]}
 if(e.code.startsWith('Digit')){const k=DK[+e.code[5]-1];if(k&&got.includes(k))P.sel=k}});
addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('blur',()=>{keys={}});
let last=0,acc=0;
function loop(t){requestAnimationFrame(loop);acc+=Math.min(100,t-last);last=t;
 while(acc>=16.67){acc-=16.67;if(mode=='play'||mode=='done')update()}
 if(mode=='menu'){const g=X.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2b1710');g.addColorStop(1,'#7a4a2a');X.fillStyle=g;X.fillRect(0,0,W,H);spr(S.big,260,H-10+sn(t*.003)*4,.8,0)}
 else if(L)draw()}
requestAnimationFrame(loop);
