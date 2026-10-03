import { ArrowUpRight } from 'lucide-react';
export default function TeamHero({ onInsights }) {
 return <section className="team-hero" aria-label="Matheus e Adriana, equipe TunaStream">
   <div className="team-hero-copy"><h2>Sua operação<br/><span>no próximo nível.</span></h2><p>Matheus e Adriana, uma visão do seu negócio.</p><button onClick={onInsights} className="hero-shortcut">Transformar dados em próximos passos<ArrowUpRight size={16}/></button></div>
   <figure><img src={import.meta.env.BASE_URL+'media/equipe-tunastream.jpeg'} alt="Matheus e Adriana juntos no estúdio da TunaStream, iluminado em roxo" fetchPriority="high"/><figcaption>Matheus &amp; Adriana</figcaption></figure>
 </section>;
}
