export const initialProfiles=[
 {user_id:'demo-matheus',display_name:'Matheus P',default_avatar:'matheus'},
 {user_id:'demo-adriana',display_name:'Adriana S',default_avatar:'adriana'},
];
export function avatarFor(profile){
 if(profile?.avatar_url&&/^(https:\/\/|blob:)/.test(profile.avatar_url))return profile.avatar_url;
 const key=profile?.default_avatar||(/adriana/i.test(profile?.display_name||'')?'adriana':'matheus');
 return import.meta.env.BASE_URL+'media/perfil-'+(key==='adriana'?'adriana.png':'matheus.jpeg');
}
