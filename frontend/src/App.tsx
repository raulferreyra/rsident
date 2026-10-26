import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { api } from './api/client';
import { signOut } from 'firebase/auth';
import { auth } from './config/firebase';

import Navbar from './components/Navbar';
import Footerbar from './components/Footerbar';
import HeroBanner from './components/HeroBanner';
import BestSellers from './components/BestSellers';
import SplashScreen from './components/SplashScreen';

import Shop from './pages/Shop';
import ShopFilter from './pages/ShopFilter';
import Collections from './pages/Collections';
import Collection from './pages/Collection';
import ProductPage from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderLookup from './pages/OrderLookup';
import NotFound from './pages/NotFound';

import { CartProvider } from './cart';

import {
  AUTH_ERROR_EVENT,
} from './api/client';

// Admin pages
import AdminNavbar from './admin/components/AdminNavbar';
import ProtectedRoute from './admin/components/ProtectedRoute';
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import Catalog from './admin/pages/Catalog';
import Products from './admin/pages/Products';
import ProductForm from './admin/pages/ProductForm';
import HomeAdmin from './admin/pages/Home';
import Orders from './admin/pages/Orders';
import OrderDetail from './admin/pages/OrderDetail';

import './App.css';
import Instagram from './components/Instagram';

function WhatsAppButton() {
  return <a className="whatsapp-float" href="https://wa.me/51999999999" target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3a12.7 12.7 0 0 0-10.8 19.4L3.5 29l6.8-1.8A12.8 12.8 0 1 0 16 3zm0 2.5a10.2 10.2 0 0 1 0 20.4c-1.7 0-3.4-.4-4.9-1.3l-.5-.3-3.8 1 1-3.7-.3-.5A10.2 10.2 0 0 1 16 5.5zm-5.4 5.2c-.3 0-.7.1-1 .5-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.2 3.3c.2.2 2.2 3.5 5.4 4.8 2.7 1.1 3.2.9 3.8.8.6-.1 1.9-.8 2.2-1.6.3-.8.3-1.5.2-1.6-.1-.2-.3-.3-.7-.5l-2.2-1.1c-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.3-.7.1a8.3 8.3 0 0 1-2.5-1.5 9.3 9.3 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.3-.6-.5-.6-.8-.6z" /></svg></a>;
}

function Home() {
  return (
    <>
      <SplashScreen />
      <main>
        <HeroBanner />
        <BestSellers />
        <Instagram />
        <WhatsAppButton />
      </main>
    </>
  );
}

function PublicLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/tienda"
          element={<Shop />}
        />

        <Route
          path="/tienda/:category"
          element={<ShopFilter />}
        />

        <Route
          path="/colecciones"
          element={<Collections />}
        />

        <Route
          path="/colecciones/:collection"
          element={<Collection />}
        />

        <Route
          path="/producto/:id"
          element={<ProductPage />}
        />

        <Route
          path="/carrito"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={<Checkout />}
        />

        <Route
          path="/pedido"
          element={<OrderLookup />}
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <Footerbar />
    </>
  );
}

function AdminLoginRoute() {
  const [user, loading] = useAuthState(auth);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    if (!user) { setIsAdmin(false); setChecking(false); return; }
    setChecking(true);
    api.get('/admin/dashboard').then(() => { if (active) setIsAdmin(true); }).catch(async () => {
      await signOut(auth);
      if (active) setIsAdmin(false);
    }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [user]);
  if (loading || checking) return <main className="admin-route-loading"><p>Verificando sesión...</p></main>;
  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Login />;
}

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={<AdminLoginRoute />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />
        
        <Route
          path="/admin/home"
          element={<HomeAdmin />}
        />

        <Route
          path="/admin/categories"
          element={
            <Catalog
              type="categories"
              title="Categorías"
            />
          }
        />

        <Route
          path="/admin/collections"
          element={
            <Catalog
              type="collections"
              title="Colecciones"
            />
          }
        />

        <Route
          path="/admin/tags"
          element={
            <Catalog
              type="tags"
              title="Etiquetas"
            />
          }
        />

        <Route
          path="/admin/products"
          element={<Products />}
        />

        <Route
          path="/admin/products/new"
          element={<ProductForm />}
        />

        <Route
          path="/admin/products/:id/edit"
          element={<ProductForm />}
        />
      </Route>

      <Route
        path="/admin/orders"
        element={<Orders />}
      />

      <Route
        path="/admin/orders/:id"
        element={<OrderDetail />}
      />
    </Routes>
  );
}

function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <AdminRoutes />
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = () => {
      if (
        location.pathname ===
        '/admin/login'
      ) {
        return;
      }

      navigate(
        '/admin/login',
        {
          replace: true,
          state: {
            message:
              'Tu sesión expiró. Inicia sesión nuevamente.',
          },
        },
      );
    };

    window.addEventListener(
      AUTH_ERROR_EVENT,
      handleAuthError,
    );

    return () => {
      window.removeEventListener(
        AUTH_ERROR_EVENT,
        handleAuthError,
      );
    };
  }, [
    location.pathname,
    navigate,
  ]);

  const isAdminRoute =
    location.pathname.startsWith('/admin');

  const isAdminLogin =
    location.pathname ===
    '/admin/login';

  if (isAdminRoute) {
    if (isAdminLogin) {
      return <AdminRoutes />;
    }

    return <AdminLayout />;
  }

  return <PublicLayout />;
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;