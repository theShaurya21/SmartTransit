import {
    ArrowRight,
    BarChart3,
    BusFront,
    CheckCircle2,
    MapPinned,
    Route,
    ShieldCheck,
    TriangleAlert
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
    {
        icon: MapPinned,
        title: "Live trip visibility",
        description: "See active trips with driver-shared device locations and clear freshness information."
    },
    {
        icon: BusFront,
        title: "Fleet management",
        description: "Keep bus details, availability, and driver assignments organized in one place."
    },
    {
        icon: Route,
        title: "Reliable route records",
        description: "Give students and staff a shared view of the routes and stops maintained by your team."
    },
    {
        icon: TriangleAlert,
        title: "Incident reporting",
        description: "Let students report transport concerns and give administrators a private review workflow."
    },
    {
        icon: BarChart3,
        title: "Operational insights",
        description: "Review dashboard summaries and analytics drawn from records stored by the application."
    },
    {
        icon: ShieldCheck,
        title: "Accountability by design",
        description: "Role-based access keeps administrative actions with authorized transport staff."
    }
];

function Landing() {
    return (
        <main className="landing-page">
            <header className="landing-nav">
                <Link className="landing-brand" to="/" aria-label="SmartTransit home">
                    <span className="landing-brand-mark"><BusFront size={22} /></span>
                    <span>SmartTransit<small>COLLEGE TRANSPORT</small></span>
                </Link>
                <nav aria-label="Main navigation">
                    <a href="#features">Platform</a>
                    <a href="#how-it-works">How it works</a>
                    <Link to="/login" className="landing-nav-signin">Sign in</Link>
                    <Link to="/register" className="button button-primary landing-nav-cta">
                        Get started <ArrowRight size={16} />
                    </Link>
                </nav>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-copy">
                    <span className="landing-eyebrow"><span /> TRANSPORT, CONNECTED</span>
                    <h1>Smarter College Transport.<br /><em>Safer Journeys.</em></h1>
                    <p>
                        One trusted place to coordinate your campus fleet, routes and
                        transport safety—with clear, current information for every journey.
                    </p>
                    <div className="landing-hero-actions">
                        <Link to="/register" className="button button-primary">
                            Get started <ArrowRight size={17} />
                        </Link>
                        <Link to="/login" className="button button-outline">
                            Sign in
                        </Link>
                    </div>
                    <div className="landing-proof">
                        <ShieldCheck size={18} />
                        <span>Role-based access <b /> Real operational records <b /> Driver-shared GPS</span>
                    </div>
                </div>
                <div className="landing-visual" aria-label="SmartTransit operations overview">
                    <div className="landing-visual-top">
                        <div>
                            <span className="landing-card-kicker">CAMPUS OPERATIONS</span>
                            <h2>Every journey,<br />in view.</h2>
                        </div>
                        <span className="landing-visual-icon"><MapPinned size={23} /></span>
                    </div>
                    <div className="landing-route-art" aria-hidden="true">
                        <span className="route-point route-point-start" />
                        <span className="route-point route-point-end" />
                        <span className="route-line route-line-one" />
                        <span className="route-line route-line-two" />
                        <span className="route-line route-line-three" />
                        <span className="route-bus"><BusFront size={20} /></span>
                    </div>
                    <div className="landing-visual-footer">
                        <div><span className="live-dot" /> ACTIVE TRIP WORKFLOW</div>
                        <span>Locations shown when shared by a driver</span>
                    </div>
                </div>
                <div className="landing-hero-decoration" aria-hidden="true" />
            </section>

            <section className="landing-feature-section" id="features">
                <div className="landing-section-heading">
                    <span className="landing-eyebrow">ONE CONNECTED PLATFORM</span>
                    <h2>Campus transport,<br />thoughtfully managed.</h2>
                    <p>Tools for the people who plan, operate and rely on every campus journey.</p>
                </div>
                <div className="landing-feature-grid">
                    {features.map(({ icon: Icon, title, description }, index) => (
                        <article className="landing-feature-card" key={title}>
                            <span className={`landing-feature-icon feature-tone-${index % 3}`}>
                                <Icon size={21} />
                            </span>
                            <h3>{title}</h3>
                            <p>{description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-how" id="how-it-works">
                <div className="landing-how-intro">
                    <span className="landing-eyebrow">HOW IT WORKS</span>
                    <h2>Clear roles.<br />Confident journeys.</h2>
                    <p>Each account sees the tools and transport information appropriate to its role.</p>
                </div>
                <div className="landing-steps">
                    <article><span>01</span><div><h3>Request an account</h3><p>Choose the account type you need. Staff access is reviewed by an administrator.</p></div></article>
                    <article><span>02</span><div><h3>Coordinate the service</h3><p>Authorized teams maintain buses, drivers, routes and incident records.</p></div></article>
                    <article><span>03</span><div><h3>Travel with clarity</h3><p>Students can check published service information and view locations when shared during an active trip.</p></div></article>
                </div>
            </section>

            <section className="landing-safety">
                <div className="landing-safety-mark"><CheckCircle2 size={26} /></div>
                <div>
                    <span className="landing-eyebrow">SAFETY & ACCOUNTABILITY</span>
                    <h2>Trust comes from clear information.</h2>
                    <p>
                        Access is controlled by account roles. Live map locations come from
                        authenticated driver devices—SmartTransit does not invent GPS positions
                        or promise an ETA without supporting data.
                    </p>
                </div>
                <Link to="/register" className="button button-outline">
                    Explore SmartTransit <ArrowRight size={17} />
                </Link>
            </section>

            <section className="landing-final-cta">
                <span className="landing-eyebrow">A BETTER JOURNEY STARTS HERE</span>
                <h2>Bring your campus transport together.</h2>
                <p>Get started with a student account or request staff access for administrator review.</p>
                <div className="landing-hero-actions">
                    <Link to="/register" className="button button-primary">Create an account <ArrowRight size={17} /></Link>
                    <Link to="/login" className="landing-text-link">Already registered? Sign in</Link>
                </div>
            </section>

            <footer className="landing-footer">
                <Link className="landing-brand" to="/" aria-label="SmartTransit home">
                    <span className="landing-brand-mark"><BusFront size={20} /></span>
                    <span>SmartTransit<small>COLLEGE TRANSPORT</small></span>
                </Link>
                <p>Campus journeys, connected with care.</p>
                <div><Link to="/login">Sign in</Link><Link to="/register">Get started</Link></div>
                <small>© {new Date().getFullYear()} SmartTransit</small>
            </footer>
        </main>
    );
}

export default Landing;
