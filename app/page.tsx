import { Wallet, Users } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="auth-wrapper">
      <section className="auth-card">
        <div className="logo-badge">
          <Wallet size={28} />
        </div>

        <h1>Controle de Gastos</h1>
        <p className="muted center">Gerencie as despesas do casal de forma simples e organizada</p>

        <div className="auth-label">
          <Users size={18} />
          <span>Selecione seu perfil para entrar:</span>
        </div>

        <div className="profile-grid">
          <Link className="profile-button" href="/dashboard?perfil=marido">
            <Users size={18} />
            <strong>Marido</strong>
          </Link>
          <Link className="profile-button" href="/dashboard?perfil=mulher">
            <Users size={18} />
            <strong>Mulher</strong>
          </Link>
        </div>
      </section>
    </main>
  );
}
