import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  // Simula buscar dados do Kanban e mover um card via socket (mock)
  const res = http.get('http://localhost:5173/api/os/kanban');
  
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
