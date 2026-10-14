export const MODULES = [
 {id:'01', title:'Start with the why.', topic:'The Soberenz mission', terms:'schools ambassador speaker speeches world', purpose:'Introduce the mission using an approved passage from your own archive.', exercise:'Deliver the opening in your own voice, then compare it with the source.'},
 {id:'02', title:'Make the science clear.', topic:'Neuroscience of alcohol', terms:'neuroscience alcohol drinking', purpose:'Build a clear explanation from your recorded neuroscience material.', exercise:'Explain the core idea using only the selected source passage.'},
 {id:'03', title:'Connect the signals.', topic:'Neurochemicals', terms:'neurochemicals neurotransmitters', purpose:'Locate your explanation of neurochemicals and preserve its original context.', exercise:'Rehearse the source explanation without adding unsupported mechanisms.'},
 {id:'04', title:'Go deeper on GABA.', topic:'GABA', terms:'GABA', purpose:'Organize your own GABA explanations into a teachable session.', exercise:'Practice the approved explanation and check every claim against its source.'},
 {id:'05', title:'Follow norepinephrine.', topic:'Norepinephrine', terms:'norepinephrine noradrenaline', purpose:'Collect your recorded explanation of norepinephrine.', exercise:'Deliver the passage and flag any additions for founder review.'},
 {id:'06', title:'Own the room.', topic:'Speaker practice', terms:'audience presentation speak stage story', purpose:'Identify delivery guidance that you actually included in your material.', exercise:'Rehearse an approved opening. Review delivery with a human coach.'},
 {id:'07', title:'Answer with integrity.', topic:'Source-grounded Q&A', terms:'question answer', purpose:'Practice answering from the archive and stopping when evidence runs out.', exercise:'Choose a question, find an approved quote, or say the archive does not cover it.'}
];
export const STOP = new Set('a an the of and or to in is it i you your my me we our what how why does do did can for with on at from that this as be about only explain tell please'.split(' '));
export const words = s => (s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>!STOP.has(w));
export function parseTranscript(raw,name='transcript.txt') {
 const text=raw.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
 if(!text) throw new Error('This file has no transcript text.');
 if(/\.(srt|vtt)$/i.test(name)) {
  const blocks=text.split(/\n\s*\n/); const segments=[];
  for(const block of blocks){ const lines=block.split('\n'); const at=lines.findIndex(l=>/\d{1,2}:\d{2}.*-->/.test(l)); if(at<0)continue; const match=lines[at].match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/); const body=lines.slice(at+1).join(' ').replace(/<[^>]*>/g,'').trim(); if(body)segments.push({start:match[1],end:match[2],text:body}); }
  if(!segments.length)throw new Error('No timed captions found. Use valid SRT or VTT captions.'); return segments;
 }
 return text.split(/\n\s*\n/).filter(Boolean).map((text,i)=>({start:null,end:null,text,paragraph:i+1}));
}
export function chunkSegments(segments) {
 const out=[];
 for(const s of segments){ const lines=s.text.match(/[^.!?]+[.!?]+(?:[”"']|$)?|[^.!?]+$/g)||[s.text]; let acc='';
  const flush=()=>{if(acc.trim())out.push({...s,text:acc.trim(),ordinal:out.length+1});acc='';};
  for(const line of lines){ let rest=line; while(rest.length>900){if(acc)flush();let cut=rest.lastIndexOf(' ',900);if(cut<100)cut=900;acc=rest.slice(0,cut);flush();rest=rest.slice(cut);}if((acc+rest).length>900&&acc)flush();acc+=rest;} flush();
 }
 return out;
}
export function retrieve(query,sources,{limit=4,includeDraft=false}={}) {
 const terms=[...new Set(words(query))]; if(!terms.length)return [];
 const eligible=sources.filter(s=>includeDraft||s.approved); const docs=eligible.flatMap(s=>s.chunks.map(c=>({...c,sourceId:s.id,title:s.title,kind:s.kind,hash:s.hash})));
 const frequencies=terms.map(t=>docs.filter(d=>words(d.text).includes(t)).length);
 return docs.map(d=>{const tokens=words(d.text);let hits=0;let score=0;terms.forEach((t,i)=>{const n=tokens.filter(x=>x===t).length;if(n){hits++;score+=Math.log(1+(docs.length+1)/(frequencies[i]+1))*n/(n+0.5+tokens.length/160);}});return {...d,score,hits};})
 .filter(d=>d.hits>0).sort((a,b)=>b.score-a.score||a.ordinal-b.ordinal).slice(0,limit);
}
export function compareRehearsal(target,attempt){
 const required=[...new Set(words(target))]; const used=new Set(words(attempt));
 const covered=required.filter(w=>used.has(w)); const additions=[...used].filter(w=>!required.includes(w));
 return {coverage:required.length?Math.round(covered.length/required.length*100):0,missing:required.filter(w=>!used.has(w)),additions};
}
export function validateSource(s){return s&&typeof s.id==='string'&&typeof s.title==='string'&&typeof s.hash==='string'&&Array.isArray(s.chunks)&&s.chunks.length<=50000&&s.chunks.every(c=>typeof c.text==='string'&&c.text.length<=20000&&Number.isInteger(c.ordinal));}
