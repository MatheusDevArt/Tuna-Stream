// Read links from the outer wrapper as well as a standalone panel. Consume sensitive
// account/OAuth parameters before rendering any outbound links.
function surface(){try{if(window.parent!==window&&window.parent.location.origin===window.location.origin)return window.parent;}catch{}return window;}
const owner=surface(),params=new URLSearchParams(owner.location.search);
export const launch={reference:params.get('confirm')||'',accountToken:params.get('account_token')||'',code:params.get('code')||'',state:params.get('state')||'',oauthError:params.get('error')||''};
if(launch.accountToken||launch.code||launch.state||launch.oauthError){const url=new URL(owner.location.href);for(const name of ['account_token','code','state','error','error_reason','error_description'])url.searchParams.delete(name);owner.history.replaceState(null,'',url.pathname+url.search+url.hash);}
export function clearConfirmation(){const url=new URL(owner.location.href);url.searchParams.delete('confirm');owner.history.replaceState(null,'',url.pathname+url.search+url.hash);}
export function openAuthorization(url){owner.location.assign(url);}
