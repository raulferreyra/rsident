import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';

function Home() {
  return <main>Home</main>;
}

function Shop() {
  return <main>Tienda</main>;
}

function Collections() {
  return <main>Colecciones</main>;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tienda" element={<Shop />} />
        <Route path="/colecciones" element={<Collections />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
