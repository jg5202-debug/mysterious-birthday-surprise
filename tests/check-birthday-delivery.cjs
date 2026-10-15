const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
class Node{
 constructor(){this.children=[];this.hidden=false;this.open=false;this.style={};this.listeners={};this.attrs={};this.classList={toggle(){},add(){},remove(){}};}
 addEventListener(name,callback){this.listeners[name]=callback;}setAttribute(name,value){this.attrs[name]=value;}append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}showModal(){this.open=true;}close(){this.open=false;}focus(){}
}
const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
let savedComplete=false,calls=0,response=null,failed=false;
const document={hidden:false,documentElement:{dataset:{}},activeElement:new Node(),body:new Node(),createElement:()=>new Node(),createElementNS:()=>new Node(),addEventListener(){}};
const events={},location={pathname:'/',search:'',hash:''},history={state:null,pushState(state,_,url){this.state=state;location.hash='#gift-delivery';},back(){location.hash='';events.popstate();},replaceState(){location.hash='';}};
const context={document,$:get,won:[],birthday:{drawLimit:3},window:{BirthdayDeliveryConfig:{waybill:'SF1580525658858',endpoint:'',shareUrl:''},BirthdayProgress:{isComplete:()=>savedComplete},addEventListener(n,f){events[n]=f;}},location,history,URL,Date,Intl,AbortController,fetch:async()=>{calls++;if(failed)throw Error('offline');return {ok:true,json:async()=>response};},setTimeout:()=>1,clearTimeout(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../src/delivery.js','utf8'),context);
const api=context.window.BirthdayDelivery,config=context.window.BirthdayDeliveryConfig;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 assert.equal(get('gift-delivery-open').hidden,true);api.open();assert.equal(get('delivery-page').open,false);
 context.won.push(1,2,7);api.sync();assert.equal(get('gift-delivery-open').hidden,true,'Three draws alone do not unlock delivery.');
 api.complete();assert.equal(get('gift-delivery-open').hidden,false);api.open();await flush();assert.equal(calls,0);assert(get('delivery-network').textContent.includes('准备中'));
 get('delivery-back').listeners.click();assert.equal(get('delivery-page').open,false);assert.equal(location.hash,'');
 const e={time:'2026-10-15T05:00:00+08:00',city:'测试城市',description:'仅供测试',longitude:116.4,latitude:39.9};
 config.endpoint='/api/gift-tracking';response={waybill:config.waybill,status:'in_transit',current:e,events:[e],updatedAt:e.time};api.open();await flush();
 assert.equal(get('delivery-title').textContent,'鸡毛正在派送礼物');assert.equal(get('delivery-marker').hidden,false);assert.equal(get('delivery-location').textContent,'测试城市');assert.equal(get('delivery-events').children.length,1);
 response={...response,status:'delivered'};await get('delivery-refresh').listeners.click();assert.equal(get('delivery-title').textContent,'白白大王的礼物已经送达');assert.equal(get('delivery-courier-title').textContent,'鸡毛，使命必达。');
 failed=true;await get('delivery-refresh').listeners.click();assert(get('delivery-network').textContent.includes('保留上次'));assert.equal(get('delivery-title').textContent,'白白大王的礼物已经送达');
 assert.throws(()=>api.normalize({...response,waybill:'other'}));assert.throws(()=>api.normalize({...response,events:[]}));assert.equal(api.mapPoint({longitude:null,latitude:null}),null);assert.equal(api.mapPoint({longitude:999,latitude:20}),null);
 assert.deepEqual(context.won,[1,2,7]);get('delivery-back').listeners.click();savedComplete=true;api.sync();assert.equal(get('gift-delivery-open').hidden,false);
 console.log('PASS: delivery opens only after full completion; no invented location without data; carrier status, map marker, refresh, offline retention and back navigation preserve prizes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
