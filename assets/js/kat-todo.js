const key = 'fmw:kat-kai:thumbnail-todo:v1';
const checkboxes = [...document.querySelectorAll('[data-todo]')];
const status = document.querySelector('#todo-save-status');
let saved = {};
try {
  const value = JSON.parse(localStorage.getItem(key) || '{}');
  if (value && typeof value === 'object' && !Array.isArray(value)) saved = value;
} catch {
  status.textContent = 'Saved checkmarks could not be loaded. You can still use this checklist.';
}
for (const checkbox of checkboxes) {
  checkbox.checked = saved[checkbox.dataset.todo] === true;
  checkbox.addEventListener('change', () => {
    saved[checkbox.dataset.todo] = checkbox.checked;
    try {
      localStorage.setItem(key, JSON.stringify(saved));
      status.textContent = 'Checkmarks saved in this browser only.';
    } catch {
      status.textContent = 'Checkmarks could not be saved in this browser. Keep this tab open to use the checklist.';
    }
  });
}

for (const section of document.querySelectorAll('[data-photo-task]')) {
  const endpoint = `/kat-kai/api/task-photos/${section.dataset.photoTask}`;
  const form = section.querySelector('form');
  const input = form.querySelector('input');
  const submit = form.querySelector('button');
  const message = section.querySelector('.upload-status');
  const gallery = section.querySelector('.photo-gallery');
  const more = section.querySelector('.load-photos');
  let cursor = null;
  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) throw new Error(data?.error || 'Could not access photos. Please check your connection and sign-in, then try again.');
    return data;
  }
  function addPhoto(photo) {
    const li=document.createElement('li');
    const a=document.createElement('a');a.href=photo.url;a.target='_blank';a.rel='noopener';
    const img=document.createElement('img');img.src=photo.url;img.alt=photo.name;img.loading='lazy';
    a.append(img,document.createTextNode(photo.name));li.append(a);gallery.append(li);
  }
  async function load(append=false) {
    more.disabled=true;
    try {
      const data=await request(endpoint+(append && cursor?`?cursor=${encodeURIComponent(cursor)}`:''));
      if(!append)gallery.replaceChildren();
      data.photos.forEach(addPhoto);cursor=data.cursor;more.hidden=!cursor;
      message.textContent=gallery.children.length?`${gallery.children.length} photo${gallery.children.length===1?'':'s'} uploaded. Open a photo to view or save the original.`:'No photos uploaded yet.';
    } catch(error) { message.textContent=error.message; }
    finally { more.disabled=false; }
  }
  more.addEventListener('click',()=>load(true));
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const files=[...input.files];
    if(!files.length){message.textContent='Choose photos first.';return;}
    if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type) || f.size>20*1024*1024)){
      message.textContent='Please choose JPG, PNG, or WebP photos, each 20 MB or smaller. Export HEIC photos as JPG first.';return;
    }
    submit.disabled=true;input.disabled=true;more.disabled=true;
    let uploaded=0;
    try {
      for(const file of files){
        message.textContent=`Uploading ${uploaded+1} of ${files.length}… Keep this tab open.`;
        const photo=await request(endpoint+`?name=${encodeURIComponent(file.name)}`,{method:'POST',headers:{'Content-Type':file.type},body:file});
        addPhoto(photo);uploaded++;
      }
      input.value='';message.textContent=`${uploaded} photo${uploaded===1?'':'s'} uploaded and saved.`;
    } catch(error) {
      message.textContent=`${uploaded} of ${files.length} uploaded. ${error.message} Successfully uploaded photos are shown below; select only the remaining files to retry.`;
    } finally { submit.disabled=false;input.disabled=false;more.disabled=false; }
  });
  load();
}
