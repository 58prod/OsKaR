import { emailNouvelInscrit } from '@/lib/auth/notificationInscription';

describe('Email de nouveau compte', () => {
  const fiche = 'https://oskar-coach.fr/admin/comptes?compte=u1';

  it('donne le nom, l’entreprise et le lien vers la fiche', () => {
    const { sujet, texte, html } = emailNouvelInscrit(
      { nom: 'Sophie Lemaire', email: 'sophie@exemple.fr', entreprise: 'Boulangerie du Marché' },
      fiche
    );
    expect(sujet).toBe('Nouveau compte — Sophie Lemaire (Boulangerie du Marché)');
    expect(texte).toContain('Email : sophie@exemple.fr');
    expect(html).toContain(fiche);
  });

  it('se passe du nom et de l’entreprise, et échappe ce qui a été saisi', () => {
    const sansNom = emailNouvelInscrit({ nom: '', email: 'a@exemple.fr', entreprise: '' }, fiche);
    expect(sansNom.sujet).toBe('Nouveau compte — a@exemple.fr');
    expect(sansNom.texte).not.toContain('Entreprise');

    const piege = emailNouvelInscrit({ nom: '<img src=x>', email: 'b@exemple.fr', entreprise: 'A & B' }, fiche);
    expect(piege.html).not.toContain('<img');
    expect(piege.html).toContain('A &amp; B');
  });
});
