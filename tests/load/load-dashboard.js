import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser menores que 2s
  },
};

export default function () {
  // Simula a requisição para buscar KPIs do Dashboard
  const res = http.get('http://localhost:5173/api/dashboard/kpis');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
