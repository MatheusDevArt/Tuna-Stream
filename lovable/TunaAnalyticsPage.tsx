import { useEffect, useState } from 'react';

/** Compatibility route; the dashboard has its own Lovable project. */
export default function TunaAnalyticsPage() {
  const [target, setTarget] = useState('https://tunastream-painel.lovable.app/');
  useEffect(() => {
    const url = 'https://tunastream-painel.lovable.app/' + window.location.search + window.location.hash;
    setTarget(url);
    window.location.replace(url);
  }, []);
  return <main style={{padding:32,background:'#0c0812',minHeight:'100dvh',color:'#fff'}}>
    <a href={target} style={{color:'#c084fc'}}>Abrir painel</a>
  </main>;
}
