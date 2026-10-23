/** Old bookmarks/shared links enter the same app, rather than another game. */
export function editorAppUrl(href){const url=new URL(href);url.pathname=url.pathname.replace(/\/editor(?:\.html)?\/?$/,'/index.html');url.searchParams.set('author','1');url.searchParams.set('mode','edit');url.searchParams.delete('editor');return url.href;}
if(typeof window!=='undefined')window.location.replace(editorAppUrl(window.location.href));
