export const books = 'Genesis|50;Exodus|40;Leviticus|27;Numbers|36;Deuteronomy|34;Joshua|24;Judges|21;Ruth|4;1 Samuel|31;2 Samuel|24;1 Kings|22;2 Kings|25;1 Chronicles|29;2 Chronicles|36;Ezra|10;Nehemiah|13;Esther|10;Job|42;Psalms|150;Proverbs|31;Ecclesiastes|12;Song of Solomon|8;Isaiah|66;Jeremiah|52;Lamentations|5;Ezekiel|48;Daniel|12;Hosea|14;Joel|3;Amos|9;Obadiah|1;Jonah|4;Micah|7;Nahum|3;Habakkuk|3;Zephaniah|3;Haggai|2;Zechariah|14;Malachi|4;Matthew|28;Mark|16;Luke|24;John|21;Acts|28;Romans|16;1 Corinthians|16;2 Corinthians|13;Galatians|6;Ephesians|6;Philippians|4;Colossians|4;1 Thessalonians|5;2 Thessalonians|3;1 Timothy|6;2 Timothy|4;Titus|3;Philemon|1;Hebrews|13;James|5;1 Peter|5;2 Peter|3;1 John|5;2 John|1;3 John|1;Jude|1;Revelation|22'.split(';').map(s => { const [name, chapters] = s.split('|'); return {name, chapters: Number(chapters)}; });
export function passageInfo(value) {
  const normalized = value.toLowerCase().replace(/\s+/g, ' ').trim().replace(/^psalm(?=\s|$)/, 'psalms');
  for (let i=0; i<books.length; i++) {
    const name = books[i].name.toLowerCase();
    if (normalized === name || normalized.startsWith(name + ' ')) {
      const tail = normalized.slice(name.length).trim();
      const match = tail.match(/^(\d+)(?:\s*[-–]\s*(\d+))?/);
      return { index:i, book:books[i].name, chapter:match ? Number(match[1]) : 0, endChapter:match ? Number(match[2] || match[1]) : 0 };
    }
  }
  return { index:99, book:'', chapter:0, endChapter:0 };
}
export function dateLabel(date) {
  const d = new Date(date + 'T12:00:00'); const n=d.getDate();
  const suffix=n%100>=11 && n%100<=13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n%10] || 'th');
  return `${d.toLocaleDateString('en-US',{weekday:'long'})}, ${d.toLocaleDateString('en-US',{month:'long'})} ${n}${suffix}, ${d.getFullYear()}`;
}
export function todayKey() { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function selectEntries(entries, {search='',book='',chapter='',sort='newest'}) {
  const q=search.toLowerCase().replace(/\s+/g,' ').trim();
  const query=passageInfo(q);
  const queryVerse=Number(q.match(/:\s*(\d+)/)?.[1] || 0);
  return entries.filter(e => {
    const p=passageInfo(e.passage);
    const passage=e.passage.toLowerCase().replace(/\s+/g,' ');
    const verses=passage.match(/:\s*(\d+)(?:\s*[-–]\s*(\d+))?/);
    const verseMatch=!queryVerse || Boolean(verses && Number(verses[1])<=queryVerse && Number(verses[2] || verses[1])>=queryVerse);
    const searchMatch=!q || (query.book && query.chapter ? p.book===query.book && p.chapter<=query.chapter && p.endChapter>=query.chapter && verseMatch : passage.includes(q));
    return searchMatch && (!book || p.book===book) && (!chapter || (p.chapter<=Number(chapter) && p.endChapter>=Number(chapter)));
  }).sort((a,b)=>{const x=passageInfo(a.passage),y=passageInfo(b.passage);return (sort==='bible' ? x.index-y.index || x.chapter-y.chapter : 0) || (sort==='oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));});
}
if (typeof document !== 'undefined') {
  const $=id=>document.getElementById(id);const key='fmw:philip-aram:quiet-time:v1';let entries=[];let readFailed=false;
  try {const raw=localStorage.getItem(key);if(raw){entries=JSON.parse(raw);if(!Array.isArray(entries) || entries.some(e=>!e || !/^\d{4}-\d{2}-\d{2}$/.test(e.date) || ['passage','quote','prayer'].some(k=>typeof e[k]!=='string' || e[k].length>5000)))throw Error('Invalid journal');}} catch {readFailed=true;entries=[];$('save-status').textContent='Could not read saved entries. Saving is paused to protect your existing data. Export anything you write before leaving.';}
  function save() { if(readFailed)return;try{localStorage.setItem(key,JSON.stringify(entries));$('save-status').textContent='Saved on this device.';}catch{$('save-status').textContent='Saving failed. Export a backup before leaving this page.';} }
  for(const b of books)$('book').add(new Option(b.name,b.name));
  function ensureToday() {const date=todayKey();if(!entries.some(e=>e.date===date))entries.push({date,passage:'',quote:'',prayer:''});}
  function render() {
    ensureToday();const list=selectEntries(entries,{search:$('search').value,sort:$('sort').value,book:$('book').value,chapter:$('chapter').value});
    $('entries').replaceChildren();$('results').textContent=list.length ? `${list.length} ${list.length===1?'entry':'entries'}` : 'No quiet times match these passages.';
    for(const entry of list){
      const article=document.createElement('article');article.className='entry';
      const top=document.createElement('div');top.className='entry-top';const heading=document.createElement('h3');heading.textContent=dateLabel(entry.date);top.append(heading);article.append(top);
      for(const [field,title] of [['passage','Passage'],['quote','Quote from the Passage'],['prayer','Prayer of Application']]) {
        const wrap=document.createElement('div');if(field!=='passage')wrap.className='writing';
        const label=document.createElement('label');const id=`${field}-${entry.date}`;label.htmlFor=id;label.textContent=title+':';
        const input=document.createElement(field==='passage'?'input':'textarea');input.id=id;input.maxLength=5000;input.value=entry[field];input.spellcheck=true;
        if(field==='passage')input.placeholder='e.g. John 3:16–21';
        const counter=document.createElement('span');counter.className='counter';counter.textContent=`${input.value.length} / 5,000`;
        input.addEventListener('input',()=>{entry[field]=input.value;counter.textContent=`${input.value.length} / 5,000`;save();});
        wrap.append(label,input,counter);(field==='passage'?top:article).append(wrap);
      }
      $('entries').append(article);
    }
  }
  $('book').addEventListener('change',()=>{const book=books.find(b=>b.name===$('book').value);$('chapter').replaceChildren(new Option('All chapters',''));$('chapter').disabled=!book;if(book)for(let n=1;n<=book.chapters;n++)$('chapter').add(new Option(String(n),String(n)));render();});
  for(const id of ['search','sort','chapter'])$(id).addEventListener(id==='search'?'input':'change',render);
  $('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,entries},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`philip-aram-quiet-time-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  function switchTab(){let section=location.hash.slice(1);if(!['quiet-time','sermons','tanoshi','equip','critz'].includes(section))section='quiet-time';for(const link of document.querySelectorAll('[data-section]')){const active=link.dataset.section===section;$(link.dataset.section).hidden=!active;if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}}
  window.addEventListener('hashchange',switchTab);window.addEventListener('focus',()=>{if(!entries.some(e=>e.date===todayKey()))render();});setInterval(()=>{if(!entries.some(e=>e.date===todayKey()))render();},60000);
  render();switchTab();
}
