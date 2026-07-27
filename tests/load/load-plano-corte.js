import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Cálculo do SVG pode ser mais pesado
  },
};

export default function () {
  const payload = JSON.stringify({
    chapa: { largura: 3210, altura: 2000 },
    pecas: [
      { largura: 1000, altura: 1000 },
      { largura: 1500, altura: 800 },
    ],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post('http://localhost:5173/api/producao/plano-corte', payload, params);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
