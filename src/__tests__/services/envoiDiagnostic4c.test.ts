import type { NextApiRequest, NextApiResponse } from 'next';
import { etatInitial4c, type Etat4c } from '@/lib/diagnostic4c/calcul';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

const envoyer = jest.fn();
jest.mock('resend', () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: envoyer } })) }));
import route from '@/pages/api/send-diagnostic4c';

function appeler(body: unknown) {
  const res = { statusCode: 0 } as { statusCode: number } & Partial<NextApiResponse>;
  res.setHeader = jest.fn() as never;
  res.status = ((c: number) => { res.statusCode = c; return res; }) as never;
  res.json = (() => res) as never;
  return route({ method: 'POST', body } as NextApiRequest, res as NextApiResponse).then(() => res);
}
function complet(): Etat4c {
  const e = etatInitial4c();
  e.seul = false;
  PILLARS.forEach((p) => { e.piliers[p.id as PillarId] = { perception: 6, reponses: ['oui', 'partiel', 'non', 'inconnu'] }; });
  return e;
}
beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test';
  envoyer.mockReset().mockResolvedValue({ error: null });
});

describe('/api/send-diagnostic4c', () => {
  it('refuse un diagnostic incomplet ou une adresse invalide', async () => {
    expect((await appeler({ email: 'a@b.fr', etat: etatInitial4c() })).statusCode).toBe(400);
    expect((await appeler({ email: 'pas-une-adresse', etat: complet() })).statusCode).toBe(400);
    expect(envoyer).not.toHaveBeenCalled();
  });

  it('recalcule le bilan et l’envoie avec les liens vers Oskar', async () => {
    const res = await appeler({ email: 'a@b.fr', etat: complet(), analyse: { profil: '<script>' } });
    expect(res.statusCode).toBe(200);
    const { html, subject, to } = envoyer.mock.calls[0][0];
    expect(to).toBe('a@b.fr');
    expect(subject).toContain('Le pilote à vue');
    expect(html).toContain('https://oskar-coach.fr/app/vision');
    expect(html).not.toContain('<script>');
  });
});
