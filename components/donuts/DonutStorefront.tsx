import Link from "next/link";
import { DONUT_PRODUCTS, DONUT_CONFIG, money } from "@/services/donuts/config";
import { DonutsFooter, DonutsNav } from "./DonutsNav";

export function DonutProductCard({ product }: { product: typeof DONUT_PRODUCTS[number] }) {
  return <article className="donuts-card">
    <div className={`donut-swatch ${product.accent}`} aria-label={`${product.name} product placeholder`} role="img" />
    <h3>{product.name}</h3><p>{product.description}</p>
    <div className="donuts-price">{money(product.priceCents)} each</div>
    <div className="donuts-help" style={{ marginTop: ".55rem" }}>Contains: {product.allergens.join(", ")}</div>
  </article>;
}

export function DonutStorefront() {
  return <main className="donuts-shell">
    <DonutsNav />
    <section className="donuts-hero">
      <div><div className="donuts-kicker">Weekend drops · Henefer, Utah</div><h1>Warm donuts, <span>made cosmic.</span></h1><p className="donuts-lede">Small-batch brioche donuts, made together in the morning and delivered fresh to your doorstep on the Saturday or Sunday you choose.</p><div className="donuts-actions"><Link href="/donuts/menu" className="donuts-button">Explore the menu</Link><Link href="/donuts/checkout" className="donuts-button secondary">Start an order</Link></div><p className="donuts-note"><strong>Seasonal kitchen.</strong> Cosmic Donuts opens during summer and winter breaks. Orders close {DONUT_CONFIG.cutoffLabel.toLowerCase()} for the upcoming weekend.</p></div>
      <div className="donuts-hero-art" aria-label="Illustrated donut placeholder"><div className="donuts-orbit" aria-hidden="true" /><div className="donut-illustration" role="img" aria-label="Intentional cosmic donut illustration placeholder" /></div>
    </section>
    <div className="donuts-banner"><span><strong>Development preview:</strong> checkout, payments, and texts are currently disabled.</span><span className="donuts-status">Kitchen configuration needed</span></div>
    <section className="donuts-section"><div className="donuts-kicker">Proposed first orbit</div><h2>Three flavors to start.</h2><div className="donuts-grid">{DONUT_PRODUCTS.map((product) => <DonutProductCard key={product.id} product={product} />)}</div></section>
    <DonutsFooter />
  </main>;
}
