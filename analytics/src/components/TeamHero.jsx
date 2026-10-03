export default function TeamHero() {
 return <section className="team-hero team-cover" aria-label="Matheus e Adriana, equipe TunaStream">
  <figure><img src={import.meta.env.BASE_URL+'media/equipe-tunastream-16x9.png'} alt="Matheus e Adriana juntos no estúdio da TunaStream" fetchPriority="high"/><figcaption>Matheus &amp; Adriana</figcaption></figure>
 </section>;
}
