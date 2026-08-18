import { useEffect, useState } from 'react';
import Storefront from '@/components/Storefront';
import AdminPanel from '@/components/AdminPanel';

type Route = 'store' | 'admin';

function getRoute(): Route {
  const hash = window.location.hash.toLowerCase();
  return hash.startsWith('#/admin') ? 'admin' : 'store';
}

function App() {
  const [route, setRoute] = useState<Route>(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'admin') {
    return <AdminPanel />;
  }
  return <Storefront />;
}

export default App;
