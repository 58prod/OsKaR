import type { NextApiRequest, NextApiResponse } from 'next';
import { createInitialState } from '@/lib/diagnostic';
import { PRESET_CASES } from '@/lib/productFit/presets';

/*
 * Routes publiques d'envoi du Diagnostic et du Potentiel Produit : elles
 * refusent un bilan fabriqué, recalculent l'analyse et échappent la saisie.
 */

const envoyer = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: envoyer } })),
}));
jest.mock('@/lib/diagnostic/pdf', () => ({ generateDiagnosticPdf: () => new Uint8Array([1]) }));
jest.mock('@/lib/productFit/pdf', () => ({ generateProductFitPdf: () => new Uint8Array([1]) }));

import sendDiagnostic from '@/pages/api/send-diagnostic';
import sendProductFit from '@/pages/api/send-product-fit';

function appeler(route: typeof sendDiagnostic, body: unknown) {
  const res = { statusCode: 0, corps: undefined as unknown } as {
    statusCode: number;
    corps: unknown;
  } & Partial<NextApiResponse>;
  res.setHeader = jest.fn() as never;
  res.status = ((code: number) => {
    res.statusCode = code;
    return res;
  }) as never;
  res.json = ((corps: unknown) => {
    res.corps = corps;
    return res;
  }) as never;
  return route({ method: 'POST', body } as NextApiRequest, res as NextApiResponse).then(() => res);
}

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test';
  envoyer.mockReset().mockResolvedValue({ error: null });
});

describe('/api/send-diagnostic', () => {
  it('refuse une analyse fabriquée sans les réponses', async () => {
    const res = await appeler(sendDiagnostic, {
      email: 'a@b.fr',
      scores: { average: 9, recap: [{ label: '<a href="x">clic</a>', score: 9, state: 's' }] },
    });
    expect(res.statusCode).toBe(400);
    expect(envoyer).not.toHaveBeenCalled();
  });

  it('recalcule l’analyse à partir des réponses', async () => {
    const responses = createInitialState();
    responses.vision = { slider: 10, checks: [true, true, true], touched: true };
    const res = await appeler(sendDiagnostic, { email: 'a@b.fr', responses });
    expect(res.statusCode).toBe(200);
    const { html } = envoyer.mock.calls[0][0];
    expect(html).toContain('1/5 piliers évalués');
    expect(html).toMatch(/Vision —\s*<strong>10,0\/10<\/strong> \(Solide\)/);
  });
});

describe('/api/send-product-fit', () => {
  it('refuse un envoi sans projet', async () => {
    const res = await appeler(sendProductFit, {
      email: 'a@b.fr',
      analysis: { globalScoreOn10: 9, personasResults: [] },
    });
    expect(res.statusCode).toBe(400);
    expect(envoyer).not.toHaveBeenCalled();
  });

  it('échappe la saisie dans le message', async () => {
    const project = {
      ...PRESET_CASES[0].project,
      projectName: '<img src=x onerror=alert(1)>',
    };
    project.personas = [{ ...project.personas[0], name: '<a href="https://piege.example">Cliquez</a>' }];
    const res = await appeler(sendProductFit, { email: 'a@b.fr', project });
    expect(res.statusCode).toBe(200);
    const { html } = envoyer.mock.calls[0][0];
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<a href');
    expect(html).toContain('&lt;a href=&quot;https://piege.example&quot;&gt;');
  });
});
