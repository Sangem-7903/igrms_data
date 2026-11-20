import { Link } from "react-router-dom";

const FOOTER_TEXT =
  "Disclaimer: Content on this website is published and managed by Commissioner of Civil Supplies, Hyderabad.";

export const hideBroken = (e) => (e.target.style.display = "none");
export const img = (name) => `${process.env.PUBLIC_URL}/${name}`;

// home = front page (Telangana Rising logo, partner logos).  nav = menu bar only (report pages).
export function Layout({ children, home = false, nav = false }) {
  const portal = home || nav;
  return (
    <div className={`igrms-page ${portal ? "home-page" : ""}`}>
      <header className="igrms-header">
        <img className="emblem" src={img("emblem.png")} alt="Government of Telangana" onError={hideBroken} />
        <div className="igrms-titles">
          <h1>
            Integrated <span className="cap">G</span>rievance <span className="cap">R</span>edressal{" "}
            <span className="cap">M</span>onitoring <span className="cap">S</span>ystem(
            <span className="cap">IGRMS</span>) for impds
          </h1>
          <p>Department of Consumer affairs, food &amp; civil supplies, GOVERNMENT OF TELANGANA</p>
        </div>
        {home ? (
          <img className="rising-logo" src={img("telangana-rising.png")} alt="Telangana Rising" onError={hideBroken} />
        ) : nav ? null : (
          <Link className="home-btn" to="/">Home</Link>
        )}
      </header>

      {portal && (
        <nav className="home-nav">
          <Link to="/">Home</Link>
          {home && <Link to="/contact">Contact</Link>}
          <Link to="/reports">Reports</Link>
        </nav>
      )}

      {children}

      {home && (
        <div className="partner-logos">
          <img src={img("logo-epos.png")} alt="ePoS" onError={hideBroken} />
          <img src={img("logo-civil-supplies.png")} alt="Civil Supplies" onError={hideBroken} />
          <img src={img("logo-food-security.png")} alt="National Food Security Cards" onError={hideBroken} />
          <img src={img("nic-logo.png")} alt="National Informatics Centre" onError={hideBroken} />
        </div>
      )}

      <footer className="igrms-footer">
        <img className="nic-logo" src={img("nic-logo.png")} alt="National Informatics Centre" onError={hideBroken} />
        <span>{FOOTER_TEXT}</span>
      </footer>
    </div>
  );
}