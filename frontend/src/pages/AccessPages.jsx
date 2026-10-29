import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Unauthorized() {
    return (
        <main className="public-message-page">
            <section className="public-message-card">
                <span className="public-message-icon"><ShieldAlert size={25} /></span>
                <span className="landing-eyebrow">ACCESS RESTRICTED</span>
                <h1>You don’t have permission to view this page.</h1>
                <p>Sign in with an authorized account or return to the SmartTransit home page.</p>
                <div className="public-message-actions">
                    <Link className="button button-primary" to="/login">Sign in</Link>
                    <Link className="button button-outline" to="/">Home</Link>
                </div>
            </section>
        </main>
    );
}

export function NotFound() {
    const location = useLocation();

    return (
        <main className="public-message-page">
            <section className="public-message-card">
                <span className="landing-eyebrow">404 · PAGE NOT FOUND</span>
                <h1>This route has gone off course.</h1>
                <p>No SmartTransit page exists at <code>{location.pathname}</code>.</p>
                <Link className="button button-primary" to="/"><ArrowLeft size={17} /> Back to home</Link>
            </section>
        </main>
    );
}
