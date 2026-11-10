import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demo,empty,ingest,handover} from '../server/iff/domain.ts';
import {formatHandover} from '../shared/handover.ts';
test('cancellation supersedes earlier receipt, independent of import order',()=>{
 for(const reverse of [false,true]){const records=[['receipt.eml','Date: 2026-09-01\nAdobe payment receipt GBP 20'],['cancel.eml','Date: 2026-10-01\nAdobe subscription cancelled']];if(reverse)records.reverse();const s=records.reduce((s,[n,t])=>ingest(s,n,t),empty());assert.equal(s.items.length,1);assert.equal(s.items[0].status,'inactive');assert.equal(s.items[0].evidence.length,2)}
});
test('duplicate import is idempotent and every quote is verifiable',()=>{const s=demo();const n=s.sources.length;ingest(s,s.sources[0].name,s.sources[0].text);assert.equal(s.sources.length,n);for(const item of s.items)for(const e of item.evidence)for(const line of e.quote.split('\n'))assert.ok(s.sources.find(x=>x.id===e.sourceId).text.includes(line));});
test('handover excludes raw evidence, unconfirmed items and other recipients',()=>{const s=demo();const guide=handover(s,'Alex');assert.equal(guide.length,1);assert.equal(guide[0].title,'Home payment');assert.equal('evidence' in guide[0],false);assert.equal('text' in guide[0],false);assert.equal(handover(s,'Stranger').length,0);});
test('unrecognized records do not generate invented findings',()=>{const s=ingest(empty(),'note.txt','Meet at the park tomorrow.');assert.equal(s.sources.length,1);assert.equal(s.items.length,0);});
test('a payment after cancellation reopens the question instead of asserting inactivity',()=>{const s=empty();ingest(s,'cancel.eml','Date: 2026-10-01\nAdobe cancelled');ingest(s,'new.eml','Date: 2026-11-01\nAdobe payment receipt GBP 20');assert.equal(s.items[0].status,'suggested');});
test('transaction evidence uses its own row date',()=>{const s=ingest(empty(),'statement.csv','date,description,amount,currency\n2026-11-02,Mortgage payment,-1250,GBP\n2026-11-03,Wise support transfer,-300,GBP');assert.equal(s.items.find(i=>i.title==='Support transfer').evidence[0].date,'2026-11-03');});
test('text export contains only the projected guide, not private evidence',()=>{const s=demo();const text=formatHandover('Alex',handover(s,'Alex'));assert.ok(text.includes('Home payment'));assert.ok(!text.includes('GBP'));assert.ok(!text.includes('adobe-receipt'));assert.ok(!text.includes('Investment account'));});
