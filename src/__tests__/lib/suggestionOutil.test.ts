import {
  SUGGESTION_MAX,
  emailSuggestionOutil,
  problemeSuggestion,
  suggestionDuCorps,
} from '@/lib/toolbox/suggestion';

describe('Suggestion d’outil — lecture du formulaire', () => {
  it('garde les champs attendus, nettoyés et bornés', () => {
    const s = suggestionDuCorps({
      name: '  World Café  ', description: 'x'.repeat(900), from: ' Alice ', email: ' alice@exemple.fr ', site: 'ignoré',
    });
    expect(s.nom).toBe('World Café');
    expect(s.description).toHaveLength(SUGGESTION_MAX.description);
    expect(s.prenom).toBe('Alice');
    expect(s.email).toBe('alice@exemple.fr');
    expect(s).not.toHaveProperty('site');
  });

  it('exige un nom et, si elle est donnée, une adresse valide', () => {
    expect(problemeSuggestion(suggestionDuCorps({ name: '' }))).toMatch(/requis/);
    expect(problemeSuggestion(suggestionDuCorps({ name: 'Check-in', email: 'pas-une-adresse' }))).toMatch(/email/);
    expect(problemeSuggestion(suggestionDuCorps({ name: 'Check-in' }))).toBeNull();
    expect(problemeSuggestion(suggestionDuCorps({ name: 'Check-in', email: 'bob@oskar-coach.fr' }))).toBeNull();
  });

  it('ignore les champs qui ne sont pas du texte', () => {
    expect(suggestionDuCorps({ name: 42, email: { a: 1 } })).toEqual({ nom: '', description: '', prenom: '', email: '' });
  });
});

describe('Suggestion d’outil — email à l’équipe', () => {
  it('échappe tout ce qui a été saisi', () => {
    const { html, sujet } = emailSuggestionOutil(suggestionDuCorps({
      name: '<script>alert(1)</script>', description: 'Un "format" <b>', from: 'Ève',
    }));
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;format&quot; &lt;b&gt;');
    // Le sujet est du texte brut (Resend l'encode) : pas d'échappement HTML.
    expect(sujet).toBe("Suggestion d'outil — <script>alert(1)</script>");
  });

  it('indique si l’on peut répondre directement', () => {
    const avec = emailSuggestionOutil(suggestionDuCorps({ name: 'Météo', from: 'Alice', email: 'alice@exemple.fr' }));
    expect(avec.html).toContain('Répondre à cet email écrit directement à Alice');
    expect(avec.texte).toContain('Email : alice@exemple.fr');
    const sans = emailSuggestionOutil(suggestionDuCorps({ name: 'Météo' }));
    expect(sans.html).toContain('Suggestion anonyme');
    expect(sans.texte).toBe("Nouvelle suggestion d'outil : Météo");
  });
});
