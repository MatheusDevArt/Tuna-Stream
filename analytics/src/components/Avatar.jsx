import {avatarFor} from '../lib/profiles.js';
export default function Avatar({profile,alt,className=''}){return <span className={'avatar-photo '+className}><img src={avatarFor(profile)} alt={alt||profile?.display_name||'Foto de perfil'}/></span>;}
