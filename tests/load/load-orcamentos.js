import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% < 1.5s
  },
};

export default function () {
  // Simula busca paginada de orçamentos
  const res = http.get('http://localhost:5173/api/orcamentos?page=1&limit=50');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
