// Backup files contain user data, never executable configuration.
export function readBackup(raw) {
 if(new TextEncoder().encode(raw).length>20*1024*1024) throw new Error('Backup exceeds the 20 MB limit.');
 let data;try{data=JSON.parse(raw)}catch{throw new Error('This is not valid JSON.');}
 if(data?.schema!=='soberenz.workspace.v1'||!Array.isArray(data.sources)||data.sources.length>1000)throw new Error('Use a Soberenz workspace backup with at most 1,000 sources.');
 const ids=new Set();let total=0;
 const sources=data.sources.map(s=>{
  if(!s||typeof s.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(s.id)||ids.has(s.id)||typeof s.title!=='string'||!s.title.trim()||s.title.length>500||typeof s.hash!=='string'||!/^[0-9a-f]{64}$/.test(s.hash)||!['txt','md','srt','vtt'].includes(s.format)||!Array.isArray(s.chunks)||!s.chunks.length)throw new Error('A source record in this backup is invalid.');
  ids.add(s.id);total+=s.chunks.length;if(total>50000)throw new Error('Backup contains too many passages.');
  const ordinals=new Set();const chunks=s.chunks.map(c=>{if(!c||!Number.isInteger(c.ordinal)||c.ordinal<1||ordinals.has(c.ordinal)||typeof c.text!=='string'||!c.text.trim()||c.text.length>20000)throw new Error('A passage in this backup is invalid.');ordinals.add(c.ordinal);const time=v=>v==null?null:typeof v==='string'&&/^[\d:.,]{1,24}$/.test(v)?v:null;return {ordinal:c.ordinal,text:c.text,start:time(c.start),end:time(c.end)}});
  return {id:s.id,title:s.title,hash:s.hash,format:s.format,kind:'speech-transcript',approved:false,createdAt:validDate(s.createdAt),chunks,deletedAt:s.deletedAt?validDate(s.deletedAt):null};
 });
 const curriculum={};for(const m of Array.isArray(data.modules)?data.modules:[]){if(!/^0[1-7]$/.test(m.id)||!Array.isArray(m.selected))continue;curriculum[m.id]={selected:m.selected.filter(k=>typeof k==='string'&&k.length<120).slice(0,100),reviewedAt:null};}
 const rawHistory=Array.isArray(data.rehearsals)?data.rehearsals:[];if(rawHistory.length>5000)throw new Error('Backup contains more than 5,000 rehearsal records.');
 const history=rawHistory.map(r=>{if(!r||typeof r.sourceId!=='string'||!Number.isInteger(r.ordinal)||typeof r.attempt!=='string'||r.attempt.length>20000||!sources.some(s=>s.id===r.sourceId&&s.chunks.some(c=>c.ordinal===r.ordinal)))throw new Error('A rehearsal record in this backup is invalid.');return {sourceId:r.sourceId,ordinal:r.ordinal,attempt:r.attempt,createdAt:validDate(r.createdAt),restored:true}});
 return {sources,curriculum,history};
}
function validDate(v){if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))throw new Error('A backup timestamp is invalid.');return new Date(v).toISOString()}
export function selectedFor(module,curriculum,sources){
 const entry=curriculum[module.id];if(!entry?.reviewedAt)return [];
 return (entry.selected||[]).flatMap(key=>{const [id,n]=key.split(':');const source=sources.find(s=>s.id===id&&s.approved&&!s.deletedAt);const c=source?.chunks.find(c=>c.ordinal===Number(n));return c?[{...c,sourceId:source.id,title:source.title,hash:source.hash}]:[]});
}
export function speakerNotes(modules,curriculum,sources){
 let out='# Soberenz — source-linked speaker notes\n\nGenerated '+new Date().toISOString()+'. Only human-reviewed selections from currently approved sources appear below. This is not certification or independent scientific validation.\n\n';
 for(const m of modules){const quotes=selectedFor(m,curriculum,sources);out+=`## Session ${m.id}: ${m.topic}\n\n`;if(!quotes.length){out+='Awaiting reviewed source selections. No teaching content is approved for this session.\n\n';continue}out+='Delivery prompt (proposed): '+m.exercise+'\n\n';for(const c of quotes){out+=c.text.split('\n').map(l=>'> '+l).join('\n')+'\n\nSource: '+c.title+' · passage '+c.ordinal+(c.start?' · '+c.start+'–'+c.end:'')+'\n\nSHA-256 file fingerprint: '+c.hash+'\n\n';}}
 return out;
}
