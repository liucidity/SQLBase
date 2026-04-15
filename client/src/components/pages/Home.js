import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.scss";
import TableChartIcon from "@mui/icons-material/TableChart";
import DataArrayIcon from "@mui/icons-material/DataArray";
import BarChartIcon from "@mui/icons-material/BarChart";

const features = [
  {
    icon: <TableChartIcon />,
    title: "Design your schema",
    description:
      "Build relational tables with a form-based editor. Set types, constraints, and foreign keys — no SQL required.",
  },
  {
    icon: <DataArrayIcon />,
    title: "Seed with real data",
    description:
      "Populate your database instantly with realistic fake data. Choose row counts and data types per column.",
  },
  {
    icon: <BarChartIcon />,
    title: "Query and visualize",
    description:
      "Run queries through a guided interface and render results as pie or bar charts in one click.",
  },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div id="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">No-code database tooling</div>
          <h1>
            Build real databases
            <br />
            without writing SQL.
          </h1>
          <p className="hero-sub">
            SQLBase gives you a visual interface to design schemas, spin up
            PostgreSQL databases, seed them with data, and explore results —
            all from your browser.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("/tables")}>
              Get started
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/user-databases")}
            >
              My databases
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="code-preview">
            <div className="code-line">
              <span className="kw">CREATE TABLE</span>
              <span className="id"> users </span>
              <span className="op">(</span>
            </div>
            <div className="code-line indent">
              <span className="col">id</span>
              <span className="type"> SERIAL PRIMARY KEY</span>
              <span className="op">,</span>
            </div>
            <div className="code-line indent">
              <span className="col">email</span>
              <span className="type"> VARCHAR(255)</span>
              <span className="op"> NOT NULL,</span>
            </div>
            <div className="code-line indent">
              <span className="col">created_at</span>
              <span className="type"> TIMESTAMP</span>
            </div>
            <div className="code-line">
              <span className="op">);</span>
            </div>
            <div className="code-line spacer" />
            <div className="code-line">
              <span className="kw">INSERT INTO</span>
              <span className="id"> users </span>
              <span className="op">(</span>
              <span className="col">email</span>
              <span className="op">)</span>
            </div>
            <div className="code-line">
              <span className="kw">VALUES</span>
              <span className="op"> (</span>
              <span className="str">'alice@example.com'</span>
              <span className="op">);</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>Everything in one place</h2>
        <p className="features-sub">
          From schema to query results — no context switching.
        </p>
        <div className="feature-cards">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="cta">
        <h2>Ready to build?</h2>
        <p>Create your first database in under a minute.</p>
        <button className="btn-primary" onClick={() => navigate("/tables")}>
          Get started
        </button>
      </section>
    </div>
  );
};

export default Home;
