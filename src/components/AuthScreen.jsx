import { useState } from "react";
import { Lock, Mail, Eye, EyeOff, LogIn, Play, Send, ArrowLeft, User } from "lucide-react";
import "./AuthScreen.css";

const AuthScreen = ({ onAuth, onDemo }) => {
  const [mode, setMode] = useState("login"); // login | register | pending | request
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Access request
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqSent, setReqSent] = useState(false);
  const [reqError, setReqError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      if (data.pending) {
        setMode("pending");
        return;
      }

      onAuth(data);
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setReqError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reqName, email: reqEmail, message: reqMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReqError(data.error || "Erreur");
        return;
      }

      setReqSent(true);
    } catch {
      setReqError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "pending") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">&#9684;</span>
            <span className="auth-logo-text">Equinox</span>
          </div>
          <div className="auth-pending">
            <p>Inscription enregistree</p>
            <p>Un administrateur va valider votre compte.</p>
          </div>
          <button
            className="auth-submit"
            onClick={() => { setMode("login"); setError(""); }}
          >
            Retour a la connexion
          </button>
        </div>
      </div>
    );
  }

  if (mode === "request") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <button className="auth-back" onClick={() => { setMode("login"); setReqSent(false); setReqError(""); }}>
            <ArrowLeft size={18} />
          </button>
          <div className="auth-logo">
            <span className="auth-logo-icon"><Send size={18} /></span>
            <span className="auth-logo-text">Demander un acces</span>
          </div>

          {reqSent ? (
            <div className="auth-success">
              Votre demande a ete envoyee. L'administrateur vous contactera.
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleRequestAccess}>
              {reqError && <div className="auth-error">{reqError}</div>}
              <div className="auth-field">
                <label>Nom</label>
                <div className="auth-input-wrapper">
                  <User size={16} />
                  <input
                    type="text"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="Votre nom"
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} />
                  <input
                    type="email"
                    value={reqEmail}
                    onChange={(e) => setReqEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Message (optionnel)</label>
                <div className="auth-input-wrapper">
                  <Send size={16} />
                  <input
                    type="text"
                    value={reqMessage}
                    onChange={(e) => setReqMessage(e.target.value)}
                    placeholder="Pourquoi souhaitez-vous un acces ?"
                  />
                </div>
              </div>
              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer la demande"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">&#9684;</span>
          <span className="auth-logo-text">Equinox</span>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => { setMode("login"); setError(""); }}
          >
            Connexion
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => { setMode("register"); setError(""); }}
          >
            Inscription
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="auth-field">
              <label>Nom</label>
              <div className="auth-input-wrapper">
                <User size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                  autoComplete="name"
                />
              </div>
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <div className="auth-input-wrapper">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <div className="auth-input-wrapper">
              <Lock size={16} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            <LogIn size={16} />
            {loading
              ? "Chargement..."
              : mode === "login" ? "Se connecter" : "Creer un compte"
            }
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <div className="auth-alt-actions">
          <button className="auth-demo-btn" onClick={onDemo}>
            <Play size={16} />
            Tester en mode demo
          </button>
          <button className="auth-request-btn" onClick={() => setMode("request")}>
            <Send size={14} />
            Demander un acces
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
