export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(url.hostname==='www.freemarketwildlife.com'){url.hostname='freemarketwildlife.com';return Response.redirect(url.href,308)}
 const legacy='/portfolio/critz/games';
 if(path===legacy||path.startsWith(legacy+'/')){url.pathname='/games'+path.slice(legacy.length);return Response.redirect(url.href,308)}
 const oldTreetop='/games/builds/treetop-trebuchet';
 if(path===oldTreetop||path.startsWith(oldTreetop+'/')){url.pathname='/games/treetop-trebuchet'+path.slice(oldTreetop.length);return Response.redirect(url.href,308)}
 if(path==='/games'){url.pathname='/games/';return Response.redirect(url.href,308)}
 if(path==='/games/kingdom-conquest'||path==='/games/kingdom-conquest/'){url.pathname='/games/critz-kingdom-conquest/';return Response.redirect(url.href,308)}
 const response=await env.ASSETS.fetch(request);const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};
