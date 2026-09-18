import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import BestSellers from './components/BestSellers';
import Footerbar from './components/Footerbar';

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

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/tienda" element={<Shop />} />
        <Route path="/tienda/:category" element={<ShopFilter />} />

        <Route path="/colecciones" element={<Collections />} />
        <Route path="/colecciones/:collection" element={<Collection />} />
      </Routes>

      <Footerbar />
    </BrowserRouter>
  );
}

export default App;