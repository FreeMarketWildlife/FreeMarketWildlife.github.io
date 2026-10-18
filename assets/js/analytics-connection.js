const link=document.querySelector('#private-analytics-link');
const status=document.querySelector('#private-analytics-status');
try{
 const response=await fetch('/assets/data/analytics-connection.json',{cache:'no-store'});
 if(!response.ok)throw new Error();
 const config=await response.json();
 if(config.serviceOrigin){
  const origin=new URL(config.serviceOrigin);
  if(origin.protocol!=='https:'||origin.hostname!=='analytics.freemarketwildlife.com')throw new Error();
  link.href=origin.origin+'/admin';link.hidden=false;
  status.textContent='Private analytics requires approved administrator sign-in. Troy connects through a separate single-use invitation.';
 }
}catch{status.textContent='Private analytics connection setup is not available yet.';}
