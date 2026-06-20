import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Result from "./pages/Result";
import "./App.css";

function App() {
  return (
    <div className="app-shell">
      {/* Folder structure: pages own route screens, components hold reusable UI, and services will hold API helpers later. */}
      <header className="site-header">
        <Link className="brand" to="/">
          Footkinator
        </Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <Link to="/">Home</Link>
          <Link to="/game">Game</Link>
          <Link to="/result">Result</Link>
        </nav>
      </header>

      <main>
        {/* React Router maps each URL to a page component without reloading the app. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
