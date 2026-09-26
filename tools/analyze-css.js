const fs = require('fs');
const css = fs.readFileSync('src/app/globals.css', 'utf8');
const rules = [];
function matchingClose(start) {
  let depth = 1, quote = null, comment = false;
  for (let i = start; i < css.length; i++) {
    const c = css[i], n = css[i + 1];
    if (comment) { if (c === '*' && n === '/') { comment = false; i++; } continue; }
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '/' && n === '*') { comment = true; i++; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}') { depth--; if (!depth) return i; }
  }
  return -1;
}
function scan(start, context='') {
  let i = start;
  while (i < css.length) {
    while (/\s/.test(css[i] || '')) i++;
    if (css.slice(i, i+2) === '/*') { const e=css.indexOf('*/',i+2); i=e<0?css.length:e+2; continue; }
    const open = css.indexOf('{', i); if (open < 0) break;
    const close = matchingClose(open+1); if (close < 0) break;
    const head = css.slice(i, open).trim();
    const body = css.slice(open+1, close);
    if (head.startsWith('@')) scanBody(body, context + head + ' > ');
    else rules.push({context, head, body, start:i, end:close+1});
    i = close + 1;
  }
}
function scanBody(body, context) {
  const old = css; // nested blocks are analyzed only for reporting via a local scanner below
  let i=0;
  while(i<body.length){
    while(/\s/.test(body[i]||''))i++;
    if(body.slice(i,i+2)==='/*'){const e=body.indexOf('*/',i+2);i=e<0?body.length:e+2;continue;}
    const o=body.indexOf('{',i); if(o<0)break;
    let d=1,j=o+1,q=null,cmt=false;
    for(;j<body.length&&d;j++){const c=body[j],n=body[j+1];if(cmt){if(c==='*'&&n==='/'){cmt=false;j++;}continue}if(q){if(c==='\\')j++;else if(c===q)q=null;continue}if(c==='/'&&n==='*'){cmt=true;j++;continue}if(c==='"'||c==="'"){q=c;continue}if(c==='{')d++;if(c==='}')d--;}
    const h=body.slice(i,o).trim(), b=body.slice(o+1,j-1);
    if(h.startsWith('@')) scanBody(b,context+h+' > '); else rules.push({context,head:h,body:b});
    i=j;
  }
}
scan(0);
const normalize = x => x.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
const groups = new Map();
for(const r of rules){const k=r.context+'\n'+r.head; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)}
console.log('rules',rules.length,'selector groups',groups.size);
let exact=0, repeated=0;
for(const [k,rs] of groups){if(rs.length>1){repeated+=rs.length-1;const bodies=new Map();for(const r of rs){const b=normalize(r.body);bodies.set(b,(bodies.get(b)||0)+1)}for(const [b,n] of bodies)if(n>1){exact+=n-1;console.log(`EXACT x${n} :: ${k.replace(/\n/g,' | ')} :: ${b.slice(0,180)}`)}}}
console.log('repeated selector instances',repeated,'exact duplicate instances',exact);
