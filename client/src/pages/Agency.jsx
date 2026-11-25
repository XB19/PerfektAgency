import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Target, Check } from 'lucide-react';
import { PageHero, Reveal, Marquee, Cover, Counter } from '../components/ui';
import { useSite } from '../lib/context';
import { useSeo } from '../lib/utils';
import { POLES, SERVICES, VALUES } from '../lib/data';

export function About() {
  const site = useSite();
  useSeo({ title: 'À propos', description: 'Histoire, vision, mission, valeurs et équipe de PERFEKT AGENCY, agence créative premium basée à Lomé, Togo.' });
  return (
    <>
      <PageHero eyebrow="À propos" title={<>Une agence née pour viser <em className="gold-text">la perfection</em>.</>} crumbs={[{ label: 'À propos' }]}>
        Créativité, communication visuelle et transformation digitale : nous aidons les organisations africaines à briller — et nous formons les talents qui feront la suite.
      </PageHero>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container grid g2" style={{ gap: 'clamp(40px, 6vw, 96px)', alignItems: 'center' }}>
          <Reveal style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', aspectRatio: '4/3.4', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
            <img src="/img/content/design-interieur-3d.webp" alt="Espace de travail PERFEKT AGENCY modélisé en 3D" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Reveal>
          <Reveal delay={120}>
            <span className="eyebrow">Notre histoire</span>
            <h2 className="h2" style={{ margin: '14px 0 22px' }}>De l’atelier créatif à l’académie digitale.</h2>
            <p className="muted">
              Basée à Lomé, PERFEKT AGENCY réunit créations digitales, stratégies & communication, UX/UI design et formations.
              Affiches, visuels institutionnels, goodies, campagnes réseaux sociaux, modélisation 3D : nous accompagnons des marques et organisations
              comme Togo Nou, MIATO, ADJAFI, Together 4 Change, Burger Fabric ou Panorama Review avec la même exigence du détail.
            </p>
            <p className="muted">
              Transmettre fait partie de notre ADN. Avec la série « Esseuh tu sais que… », nous démystifions les métiers du digital ;
              avec nos formations Pro en Graphisme, Community Management et Montage vidéo, nous formons les créatifs de demain.
            </p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', margin: 0 }} className="gold">Perfekt, tout simplement.</p>
          </Reveal>
        </div>
      </section>

      <section className="section bg-soft">
        <div className="container grid g2">
          {[
            { icon: Eye, t: 'Notre vision', d: 'Devenir la référence africaine en créativité, communication visuelle et formation multimédia — une plateforme où naissent les marques et les talents de demain.' },
            { icon: Target, t: 'Notre mission', d: 'Accompagner entreprises, institutions, ONG, entrepreneurs et particuliers dans la conception de leur identité visuelle, leur communication digitale et le développement de leurs compétences.' },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 100} className="card" style={{ padding: 'clamp(32px, 4vw, 48px)' }}>
              <span className="icon-tile"><b.icon /></span>
              <h3 className="serif" style={{ fontSize: '2rem' }}>{b.t}</h3>
              <p className="muted" style={{ marginBottom: 0 }}>{b.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="section-head"><div><span className="eyebrow">Nos valeurs</span><h2 className="h2">Ce qui nous guide, chaque jour.</h2></div></Reveal>
          <div className="grid g4">
            {VALUES.map((v, i) => (
              <Reveal key={v.t} delay={i * 80} className="stat">
                <div className="serif gold" style={{ fontSize: '1.1rem' }}>0{i + 1}</div>
                <h3 className="serif" style={{ fontSize: '1.9rem', margin: '10px 0 10px' }}>{v.t}</h3>
                <p className="muted small" style={{ margin: 0 }}>{v.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-soft">
        <div className="container">
          <Reveal className="section-head"><div><span className="eyebrow">Notre équipe</span><h2 className="h2">Des experts passionnés.</h2></div></Reveal>
          <div className="grid g3">
            {(site.team || []).map((m, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '4/5', marginBottom: 18 }}>
                  {m.photo ? <img src={m.photo} alt={m.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : <Cover seed={m.name + i} variant={i + 1} />}
                </div>
                <strong style={{ display: 'block', fontSize: '1.05rem' }}>{m.name}</strong>
                <span className="muted small">{m.role}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container"><Reveal className="section-head"><div><span className="eyebrow">Nos partenaires</span><h2 className="h2">Ils avancent avec nous.</h2></div></Reveal></div>
        <Marquee items={site.partners || []} />
        <div className="container grid g4" style={{ marginTop: 80 }}>
          {(site.stats || []).map((s) => (
            <div key={s.label} className="stat"><div className="stat-value"><Counter value={Number(s.value)} suffix={s.suffix} /></div><div className="stat-label">{s.label}</div></div>
          ))}
        </div>
      </section>
    </>
  );
}

export function Services() {
  useSeo({ title: 'Services', description: 'Graphisme, branding, logo, identité visuelle, vidéo, community management, publicité Facebook, Instagram et Google, stratégie digitale et conseil.' });
  return (
    <>
      <PageHero eyebrow="Services" title={<>Tout ce dont votre marque a besoin, <em className="gold-text">sous un même toit</em>.</>} crumbs={[{ label: 'Services' }]}>
        {SERVICES.length} expertises réunies en 4 pôles pour concevoir, produire et diffuser une communication premium.
      </PageHero>
      {POLES.map((p, pi) => (
        <section key={p.id} id={p.id} className={`section ${pi % 2 ? 'bg-soft' : ''}`} style={{ scrollMarginTop: 'var(--header-h)' }}>
          <div className="container grid split">
            <Reveal className="split-aside">
              <div className="serif gold" style={{ fontSize: '1.2rem' }}>0{pi + 1}</div>
              <h2 className="h2" style={{ margin: '10px 0 16px' }}>{p.name}</h2>
              <p className="muted">{p.desc}</p>
              <Link to={`/devis?service=${encodeURIComponent(p.name)}`} className="btn btn-sm" style={{ marginTop: 12 }}>Demander un devis <ArrowRight className="arrow" /></Link>
            </Reveal>
            <div className="grid g2">
              {SERVICES.filter((s) => s.pole === p.id).map((s, i) => (
                <Reveal key={s.slug} delay={i * 60} id={s.slug}>
                  <div className="scard">
                    <span className="icon-tile"><s.icon /></span>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <ul className="check-list small" style={{ display: 'grid', marginBottom: 22 }}>
                      {['Brief & recherche', 'Création sur mesure', 'Livraison tous formats'].map((x) => <li key={x}><Check />{x}</li>)}
                    </ul>
                    <Link to={`/devis?service=${encodeURIComponent(s.title)}`} className="link">Devis pour ce service <ArrowRight /></Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ))}
      <section className="section">
        <div className="container">
          <Reveal className="cta-band">
            <img className="mark" src="/img/logo-mark.png" alt="" aria-hidden="true" />
            <h2 className="h2" style={{ maxWidth: 680 }}>Un projet en tête ? Parlons-en.</h2>
            <p className="lead" style={{ marginTop: 16 }}>Réponse personnalisée sous 24 à 48 h ouvrées.</p>
            <div className="hero-ctas" style={{ marginTop: 30 }}>
              <Link to="/devis" className="btn btn-gold">Demander un devis <ArrowRight className="arrow" /></Link>
              <Link to="/portfolio" className="btn btn-ghost">Voir nos réalisations</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
