export function matchesTutorial(query,text){return query.toLowerCase().trim().split(/\s+/).every(word=>text.toLowerCase().includes(word));}
if(typeof document!=='undefined'){
 const input=document.querySelector('#tutorial-search'),cards=[...document.querySelectorAll('[data-tutorial]')];
 input.addEventListener('input',()=>{let count=0;for(const card of cards){card.hidden=!matchesTutorial(input.value,`${card.textContent} ${card.dataset.keywords}`);if(!card.hidden)count++;}document.querySelector('#search-status').textContent=`${count} tutorial${count===1?'':'s'}`;document.querySelector('#search-empty').hidden=count!==0;});
}
