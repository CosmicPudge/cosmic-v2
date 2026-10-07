import Link from "next/link";

export function DonutsNav() {
  return <header className="donuts-nav">
    <Link href="/donuts" className="donuts-brand"><span className="donuts-mark" aria-hidden="true" />Cosmic Donuts</Link>
    <nav className="donuts-links" aria-label="Donut shop navigation">
      <Link href="/donuts/menu">Menu</Link><Link href="/donuts/track/demo-order">Track an order</Link><Link href="/donuts/checkout" className="donuts-button">Build a box</Link>
    </nav>
  </header>;
}

export function DonutsFooter() { return <footer className="donuts-footer"><span>Small batches from Henefer, Utah.</span><span>Seasonal weekends · Doorstep delivery</span></footer>; }
