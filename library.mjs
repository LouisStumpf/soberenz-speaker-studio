// Public supplied scripts are separate from the visitor's approved transcript workspace.
export function validateScripts(records){
 if(!Array.isArray(records)||!records.length||records.length>1000)throw new Error('The script collection could not be read.');
 const seen=new Set();
 for(const r of records){
  if(!r||typeof r.id!=='string'||!/^[A-Za-z0-9-]{1,80}$/.test(r.id)||seen.has(r.id))throw new Error('Invalid script identifier.');
  seen.add(r.id);
  for(const key of ['title','transcript','topic_id','primary_topic','audience','audience_key'])if(typeof r[key]!=='string'||!r[key].trim())throw new Error('A script record is incomplete.');
  if(!Array.isArray(r.sections)||!r.sections.length||r.sections.some(s=>!s||typeof s.section!=='string'||typeof s.text!=='string'))throw new Error('Script sections are incomplete.');
  if(r.sections.map(s=>s.text).join('\n\n')!==r.transcript)throw new Error('Script sections differ from the supplied text.');
 }
 return records;
}
const searchable = new WeakMap();
export function filterScripts(records,{query='',topic='',audience=''}={}){
 const terms=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,30);
 return records.filter(r=>{
  if(topic&&r.topic_id!==topic)return false;
  if(audience&&r.audience_key!==audience)return false;
  let text=searchable.get(r);if(!text){text=[r.id,r.title,r.primary_topic,r.audience,...(r.tags||[]),r.transcript].join(' ').toLocaleLowerCase();searchable.set(r,text)}
  return terms.every(t=>text.includes(t));
 });
}
export function scriptText(record){
 return ['Speech scripts supplied by Louis',record.id+' · '+record.title,'Audience: '+record.audience,'',record.transcript,'','Original collection and documentation: https://louisstumpf.github.io/soberenz-speaker-studio/#scripts',''].join('\n');
}
export function catalogOptions(records,key,labelKey){
 return [...new Map(records.map(r=>[r[key],r[labelKey]])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
}
