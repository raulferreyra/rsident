import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Footerbar from './components/Footerbar';
import HeroBanner from './components/HeroBanner';
import BestSellers from './components/BestSellers';

// Admin pages
import ProtectedRoute from './admin/components/ProtectedRoute';
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import Catalog from './admin/pages/Catalog';
import Products from './admin/pages/Products';
import ProductForm from './admin/pages/ProductForm';

function Home() {
  return (
    <main>
      <HeroBanner />
      <BestSellers />
    </main>
  );
}

function Shop() {
  return <main>Tienda</main>;
}

function ShopFilter() {
  return <main>Filtro de tienda</main>;
}

function Collections() {
  return <main>Colecciones</main>;
}

function Collection() {
  return <main>Colección</main>;
}

function PublicLayout() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

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
      </Routes>

      <Footerbar />
    </>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={<Login />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
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
          path="/admin/products/:id"
          element={<ProductForm />}
        />
      </Route>
    </Routes>
  );
}

function AppContent() {
  const location = useLocation();

  const isAdminRoute =
    location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminRoutes />;
  }

  return <PublicLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;