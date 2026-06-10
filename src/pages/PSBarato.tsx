import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, X, Trash2, Search, Clock,
  CreditCard, QrCode, FileText, Tag, Copy,
  CheckCircle2, ChevronLeft, Users,
} from "lucide-react";

interface Game {
  id: number;
  name: string;
  price: number;
  image: string;
}

interface CartItem {
  game: Game;
  quantity: number;
}

type PaymentMethod = "card" | "pix" | "boleto";
type CheckoutStep = "cart" | "coupon" | "payment" | "confirm";

const REFERRAL_DISCOUNT = 0.30;
const VALID_COUPONS: Record<string, number> = {
  "AMIGO30": REFERRAL_DISCOUNT,
  "INDICA30": REFERRAL_DISCOUNT,
  "DESCONTO30": REFERRAL_DISCOUNT,
};

const GAMES: Game[] = [
  { id: 1, name: "God of War", price: 49.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1tmu.webp" },
  { id: 2, name: "Red Dead Redemption 2", price: 79.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.webp" },
  { id: 3, name: "Elden Ring", price: 69.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp" },
  { id: 4, name: "Spider-Man 2", price: 89.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co7dli.webp" },
  { id: 5, name: "The Last of Us Part I", price: 59.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5xcu.webp" },
  { id: 6, name: "Ghost of Tsushima", price: 54.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4416.webp" },
  { id: 7, name: "Horizon Forbidden West", price: 64.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.webp" },
  { id: 8, name: "Ratchet & Clank: Rift Apart", price: 44.90, image: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2ysg.webp" },
];

const MY_REFERRAL_CODE = "AMIGO30";

const PIX_KEY = "pagamentos@psbarato.com.br";

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function useCountdown(h: number, m: number, s: number) {
  const [time, setTime] = useState({ hours: h, minutes: m, seconds: s });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(time.hours)}:${p(time.minutes)}:${p(time.seconds)}`;
}

export default function PSBaratoPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("cart");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);

  const countdown = useCountdown(23, 59, 59);
  const cartRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const filteredGames = GAMES.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.game.price * i.quantity, 0);
  const discountRate = appliedCoupon ? VALID_COUPONS[appliedCoupon] : 0;
  const discountAmount = cartSubtotal * discountRate;
  const cartTotal = cartSubtotal - discountAmount;

  function addToCart(game: Game) {
    setCart((prev) => {
      const existing = prev.find((item) => item.game.id === game.id);
      if (existing) return prev.map((i) => i.game.id === game.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { game, quantity: 1 }];
    });
    setAddedId(game.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  function removeFromCart(id: number) {
    setCart((prev) => prev.filter((i) => i.game.id !== id));
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.game.id === id ? { ...i, quantity: i.quantity + delta } : i)
          .filter((i) => i.quantity > 0)
    );
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponError("");
    } else {
      setCouponError("Cupom inválido. Tente: AMIGO30");
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  function openCart() {
    setCheckoutStep("cart");
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setTimeout(() => setCheckoutStep("cart"), 300);
  }

  function finishPurchase() {
    setCheckoutStep("confirm");
  }

  function resetAll() {
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    closeCart();
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 2000);
    });
  }

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }

  function formatExpiry(val: string) {
    return val.replace(/\D/g, "").slice(0, 4).replace(/(.{2})/, "$1/");
  }

  const canPay =
    paymentMethod === "pix" || paymentMethod === "boleto" ||
    (paymentMethod === "card" && cardNumber.length >= 19 && cardName.trim().length >= 3 && cardExpiry.length >= 5 && cardCvv.length >= 3);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!cartOpen) return;
      const inCart = cartRef.current?.contains(target);
      const inCheckout = checkoutRef.current?.contains(target);
      if (!inCart && !inCheckout) closeCart();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [cartOpen]);

  const STEP_LABELS: Record<CheckoutStep, string> = {
    cart: "Carrinho",
    coupon: "Cupom & Resumo",
    payment: "Pagamento",
    confirm: "Confirmado!",
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans">

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-[8%] py-4 bg-[#08111f] border-b border-[#20314e] sticky top-0 z-30">
        <div className="flex items-center gap-2 text-2xl font-bold leading-none">
          <span>🎮</span>
          <span>PS <span className="text-[#22D3EE]">Barato</span></span>
        </div>

        <nav className="hidden md:flex gap-6 text-sm">
          {["Início", "Jogos", "Promoções", "Contato"].map((item) => (
            <a key={item} href="#" className="text-white hover:text-[#22D3EE] transition-colors duration-200">{item}</a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar jogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
              className="pl-9 pr-4 py-2 w-52 rounded-lg bg-[#1E293B] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50"
            />
          </div>

          <button
            onClick={() => setReferralOpen(true)}
            data-testid="button-referral"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] border border-[#22D3EE]/40 px-3 py-2 rounded-lg hover:bg-[#22D3EE]/10 transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Indicar Amigo
          </button>

          <button
            onClick={openCart}
            data-testid="button-cart-open"
            className="relative flex items-center gap-2 bg-[#22D3EE] text-[#0F172A] font-semibold px-4 py-2 rounded-lg hover:bg-[#06b6d4] transition-colors text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {cartCount > 0 && (
              <span data-testid="text-cart-count" className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        className="h-[80vh] flex items-center px-[8%]"
        style={{ background: "linear-gradient(rgba(0,0,0,0.65),rgba(0,0,0,0.65)),url('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600') center/cover no-repeat" }}
      >
        <div>
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            ATÉ <span className="text-[#22D3EE]">90% OFF</span>
          </h1>
          <p className="mt-4 text-lg text-gray-200 max-w-md">Os melhores jogos PlayStation com os menores preços.</p>
          <button
            onClick={() => document.getElementById("jogos")?.scrollIntoView({ behavior: "smooth" })}
            data-testid="button-ver-ofertas"
            className="mt-6 px-8 py-4 bg-[#22D3EE] text-[#0F172A] font-bold rounded-xl hover:bg-[#06b6d4] transition-colors"
          >
            Ver Ofertas
          </button>
          <div className="mt-5 flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-[#22D3EE]" />
            <span>Oferta termina em:</span>
            <span data-testid="text-countdown" className="text-[#22D3EE] font-bold text-xl tabular-nums">{countdown}</span>
          </div>
        </div>
      </section>

      {/* ── Search mobile ── */}
      <div className="sm:hidden px-[8%] pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Buscar jogo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2 w-full rounded-lg bg-[#1E293B] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50" />
        </div>
      </div>

      {/* ── Games ── */}
      <section id="jogos" className="px-[8%] py-16">
        <h2 className="text-3xl font-bold mb-8">Jogos em Destaque</h2>
        {filteredGames.length === 0 ? (
          <p className="text-gray-400 text-center py-16">Nenhum jogo encontrado para "{search}".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const inCart = cart.find((i) => i.game.id === game.id);
              const justAdded = addedId === game.id;
              return (
                <div key={game.id} data-testid={`card-game-${game.id}`} className="bg-[#1E293B] rounded-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-300 flex flex-col">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-56 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586182987320-4f376d39d787?auto=format&fit=crop&w=400&h=225&q=80"; }}
                  />
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-white mb-1">{game.name}</h3>
                    <p className="text-[#22D3EE] text-2xl font-bold mb-4">R$ {fmt(game.price)}</p>
                    <div className="mt-auto flex items-center gap-2">
                      {inCart && (
                        <div className="flex items-center gap-1 bg-[#0F172A] rounded-lg px-2 py-1">
                          <button onClick={() => changeQty(game.id, -1)} data-testid={`button-qty-minus-${game.id}`} className="w-6 h-6 flex items-center justify-center text-[#22D3EE] hover:bg-white/10 rounded font-bold">−</button>
                          <span className="w-5 text-center text-sm font-semibold">{inCart.quantity}</span>
                          <button onClick={() => changeQty(game.id, 1)} data-testid={`button-qty-plus-${game.id}`} className="w-6 h-6 flex items-center justify-center text-[#22D3EE] hover:bg-white/10 rounded font-bold">+</button>
                        </div>
                      )}
                      <button
                        onClick={() => addToCart(game)}
                        data-testid={`button-buy-${game.id}`}
                        className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${justAdded ? "bg-green-500 text-white scale-95" : "bg-[#22D3EE] text-[#0F172A] hover:bg-[#06b6d4]"}`}
                      >
                        {justAdded ? "Adicionado!" : inCart ? "Adicionar mais" : "Comprar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Features ── */}
      <section className="px-[8%] pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: "⚡", label: "Promoções Especiais" },
          { icon: "💳", label: "Parcelamento em 12x" },
          { icon: "👥", label: "Indique e Ganhe 30%" },
          { icon: "🔔", label: "Alertas de Desconto" },
        ].map((f) => (
          <div key={f.label} className="bg-[#1E293B] py-7 px-6 rounded-xl text-center font-semibold text-sm">
            <span className="text-2xl mr-2">{f.icon}</span>{f.label}
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#08111f] text-center py-7 text-sm text-gray-400">
        © 2026 PS Barato - Todos os direitos reservados.
      </footer>

      {/* ── Backdrop ── */}
      {(cartOpen || referralOpen) && <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => { closeCart(); setReferralOpen(false); }} />}

      {/* ── Referral Modal ── */}
      {referralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0F172A] border border-[#20314e] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Users className="w-5 h-5 text-[#22D3EE]" />
                Indicar Amigo
              </div>
              <button onClick={() => setReferralOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-[#1E293B] rounded-xl p-4 mb-5 border border-[#22D3EE]/20">
              <p className="text-sm text-gray-400 mb-1">Seu código de indicação</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#22D3EE] tracking-widest">{MY_REFERRAL_CODE}</span>
                <button
                  onClick={() => copyText(MY_REFERRAL_CODE, setCopiedReferral)}
                  data-testid="button-copy-referral"
                  className="flex items-center gap-1.5 text-xs bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copiedReferral ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3 bg-[#1E293B] rounded-xl p-3">
                <span className="text-xl">1️⃣</span>
                <p>Compartilhe o código <strong className="text-white">AMIGO30</strong> com seus amigos</p>
              </div>
              <div className="flex items-start gap-3 bg-[#1E293B] rounded-xl p-3">
                <span className="text-xl">2️⃣</span>
                <p>Seu amigo aplica o código no carrinho e ganha <strong className="text-[#22D3EE]">30% de desconto</strong></p>
              </div>
              <div className="flex items-start gap-3 bg-[#1E293B] rounded-xl p-3">
                <span className="text-xl">3️⃣</span>
                <p>A cada indicação confirmada você também ganha <strong className="text-[#22D3EE]">créditos</strong> para usar nas próximas compras!</p>
              </div>
            </div>

            <button onClick={() => setReferralOpen(false)} className="mt-5 w-full py-3 bg-[#22D3EE] text-[#0F172A] font-bold rounded-xl hover:bg-[#06b6d4] transition-colors text-sm">Entendi!</button>
          </div>
        </div>
      )}

      {/* ── Cart / Checkout Drawer ── */}
      <div
        ref={cartRef}
        data-testid="cart-drawer"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#0F172A] border-l border-[#20314e] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#20314e] flex-shrink-0">
          <div className="flex items-center gap-2">
            {checkoutStep !== "cart" && checkoutStep !== "confirm" && (
              <button
                onClick={() => setCheckoutStep(checkoutStep === "payment" ? "coupon" : "cart")}
                className="p-1 rounded-lg hover:bg-white/10 mr-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="font-bold text-base">{STEP_LABELS[checkoutStep]}</span>
            {checkoutStep === "cart" && cartCount > 0 && (
              <span className="bg-[#22D3EE] text-[#0F172A] text-xs px-2 py-0.5 rounded-full font-bold">{cartCount}</span>
            )}
          </div>
          <button onClick={closeCart} data-testid="button-cart-close" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── STEP: CART ── */}
        {checkoutStep === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                  <ShoppingCart className="w-14 h-14 opacity-30" />
                  <p className="font-semibold">Seu carrinho está vazio</p>
                  <p className="text-sm text-center">Adicione jogos para continuar a compra.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item) => (
                    <div key={item.game.id} data-testid={`cart-item-${item.game.id}`} className="flex items-center gap-3 bg-[#1E293B] rounded-xl p-3">
                      <img
                        src={item.game.image}
                        alt={item.game.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1586182987320-4f376d39d787?auto=format&fit=crop&w=56&h=56&q=80"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.game.name}</p>
                        <p className="text-[#22D3EE] font-bold text-sm">R$ {fmt(item.game.price * item.quantity)}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={() => changeQty(item.game.id, -1)} data-testid={`button-cart-minus-${item.game.id}`} className="w-6 h-6 flex items-center justify-center bg-[#0F172A] rounded text-[#22D3EE] hover:bg-white/10 font-bold text-sm">−</button>
                          <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => changeQty(item.game.id, 1)} data-testid={`button-cart-plus-${item.game.id}`} className="w-6 h-6 flex items-center justify-center bg-[#0F172A] rounded text-[#22D3EE] hover:bg-white/10 font-bold text-sm">+</button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.game.id)} data-testid={`button-cart-remove-${item.game.id}`} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="px-5 py-5 border-t border-[#20314e] flex flex-col gap-3 flex-shrink-0">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{cartCount} {cartCount === 1 ? "item" : "itens"}</span>
                  <button onClick={() => setCart([])} data-testid="button-cart-clear" className="text-red-400 hover:text-red-300 text-xs transition-colors">Limpar carrinho</button>
                </div>
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Subtotal</span>
                  <span className="text-[#22D3EE]">R$ {fmt(cartSubtotal)}</span>
                </div>
                <button
                  onClick={() => setCheckoutStep("coupon")}
                  data-testid="button-to-coupon"
                  className="w-full py-4 bg-[#22D3EE] text-[#0F172A] font-bold rounded-xl hover:bg-[#06b6d4] transition-colors text-sm"
                >
                  Continuar →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP: COUPON ── */}
        {checkoutStep === "coupon" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

              {/* Coupon input */}
              <div className="bg-[#1E293B] rounded-xl p-4">
                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Tag className="w-4 h-4 text-[#22D3EE]" /> Cupom de desconto</p>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      {appliedCoupon} — 30% de desconto aplicado!
                    </div>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Digite seu cupom"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        data-testid="input-coupon"
                        className="flex-1 px-3 py-2 rounded-lg bg-[#0F172A] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 uppercase tracking-wider"
                      />
                      <button
                        onClick={applyCoupon}
                        data-testid="button-apply-coupon"
                        className="px-4 py-2 bg-[#22D3EE] text-[#0F172A] font-bold rounded-lg text-sm hover:bg-[#06b6d4] transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
                  </>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  Tem um código de indicação? Use <span className="text-[#22D3EE] font-semibold">AMIGO30</span> e ganhe 30% de desconto!
                </p>
              </div>

              {/* Order summary */}
              <div className="bg-[#1E293B] rounded-xl p-4">
                <p className="text-sm font-semibold mb-3">Resumo do pedido</p>
                <div className="flex flex-col gap-2 text-sm">
                  {cart.map((item) => (
                    <div key={item.game.id} className="flex justify-between text-gray-300">
                      <span className="truncate max-w-[180px]">{item.game.name} ×{item.quantity}</span>
                      <span>R$ {fmt(item.game.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-[#20314e] pt-2 mt-1 flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>R$ {fmt(cartSubtotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-400 font-semibold">
                      <span>Desconto ({(discountRate * 100).toFixed(0)}%)</span>
                      <span>− R$ {fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1">
                    <span>Total</span>
                    <span className="text-[#22D3EE]">R$ {fmt(cartTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 border-t border-[#20314e] flex-shrink-0">
              <button
                onClick={() => setCheckoutStep("payment")}
                data-testid="button-to-payment"
                className="w-full py-4 bg-[#22D3EE] text-[#0F172A] font-bold rounded-xl hover:bg-[#06b6d4] transition-colors text-sm"
              >
                Escolher Pagamento →
              </button>
            </div>
          </>
        )}

        {/* ── STEP: PAYMENT ── */}
        {checkoutStep === "payment" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

              {/* Method selector */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "card" as PaymentMethod, icon: <CreditCard className="w-5 h-5" />, label: "Cartão" },
                  { id: "pix" as PaymentMethod, icon: <QrCode className="w-5 h-5" />, label: "Pix" },
                  { id: "boleto" as PaymentMethod, icon: <FileText className="w-5 h-5" />, label: "Boleto" },
                ]).map(({ id, icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    data-testid={`button-method-${id}`}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMethod === id
                        ? "border-[#22D3EE] bg-[#22D3EE]/10 text-[#22D3EE]"
                        : "border-[#20314e] bg-[#1E293B] text-gray-400 hover:border-[#22D3EE]/50"
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>

              {/* Card form */}
              {paymentMethod === "card" && (
                <div className="bg-[#1E293B] rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-[#22D3EE]" /> Dados do cartão</p>
                  <input
                    type="text"
                    placeholder="Número do cartão"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    data-testid="input-card-number"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 tabular-nums tracking-widest"
                  />
                  <input
                    type="text"
                    placeholder="Nome no cartão"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    data-testid="input-card-name"
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50 uppercase tracking-wider"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Validade MM/AA"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                      data-testid="input-card-expiry"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      maxLength={4}
                      data-testid="input-card-cvv"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#0F172A] text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/50"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Parcelamento em até 12× sem juros</p>
                </div>
              )}

              {/* Pix */}
              {paymentMethod === "pix" && (
                <div className="bg-[#1E293B] rounded-xl p-4 flex flex-col items-center gap-4">
                  <p className="text-sm font-semibold self-start flex items-center gap-1.5"><QrCode className="w-4 h-4 text-[#22D3EE]" /> Pagamento via Pix</p>
                  <div className="bg-white p-4 rounded-xl">
                    <div className="w-36 h-36 bg-[#0F172A] rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-white opacity-60" />
                    </div>
                  </div>
                  <div className="w-full bg-[#0F172A] rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 truncate">{PIX_KEY}</span>
                    <button
                      onClick={() => copyText(PIX_KEY, setCopiedPix)}
                      data-testid="button-copy-pix"
                      className="flex items-center gap-1 text-xs text-[#22D3EE] hover:text-white transition-colors flex-shrink-0"
                    >
                      {copiedPix ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Escaneie o QR Code ou copie a chave Pix. O pagamento é confirmado em segundos.</p>
                </div>
              )}

              {/* Boleto */}
              {paymentMethod === "boleto" && (
                <div className="bg-[#1E293B] rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><FileText className="w-4 h-4 text-[#22D3EE]" /> Boleto Bancário</p>
                  <div className="bg-[#0F172A] rounded-lg p-3 text-xs text-gray-400 flex flex-col gap-1.5">
                    <div className="flex justify-between"><span>Vencimento</span><span className="text-white">em 3 dias úteis</span></div>
                    <div className="flex justify-between"><span>Valor</span><span className="text-[#22D3EE] font-bold">R$ {fmt(cartTotal)}</span></div>
                    <div className="flex justify-between"><span>Processamento</span><span className="text-white">1–2 dias úteis</span></div>
                  </div>
                  <p className="text-xs text-gray-500">O boleto será gerado após a confirmação do pedido. Pague em qualquer banco ou lotérica.</p>
                </div>
              )}

              {/* Total reminder */}
              <div className="bg-[#1E293B] rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-400">Total a pagar</span>
                <span className="text-[#22D3EE] font-bold text-lg">R$ {fmt(cartTotal)}</span>
              </div>
            </div>

            <div className="px-5 py-5 border-t border-[#20314e] flex-shrink-0">
              <button
                onClick={finishPurchase}
                disabled={!canPay}
                data-testid="button-confirm-payment"
                className={`w-full py-4 font-bold rounded-xl text-sm transition-all ${canPay ? "bg-[#22D3EE] text-[#0F172A] hover:bg-[#06b6d4]" : "bg-[#1E293B] text-gray-500 cursor-not-allowed"}`}
              >
                {paymentMethod === "card" ? "Confirmar Pagamento" : paymentMethod === "pix" ? "Já Paguei o Pix" : "Gerar Boleto"}
              </button>
            </div>
          </>
        )}

        {/* ── STEP: CONFIRM ── */}
        {checkoutStep === "confirm" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Pedido confirmado!</h3>
              <p className="text-gray-400 text-sm">
                {paymentMethod === "pix" && "Pagamento Pix recebido. Seus jogos estão disponíveis na sua conta."}
                {paymentMethod === "boleto" && "Boleto gerado! Assim que o pagamento for confirmado, seus jogos serão liberados."}
                {paymentMethod === "card" && "Pagamento aprovado! Seus jogos estão disponíveis na sua conta."}
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-4 w-full text-sm">
              <div className="flex justify-between text-gray-400 mb-1"><span>Itens</span><span>{cartCount}</span></div>
              {appliedCoupon && <div className="flex justify-between text-green-400 mb-1"><span>Cupom {appliedCoupon}</span><span>−30%</span></div>}
              <div className="flex justify-between font-bold text-base"><span>Total pago</span><span className="text-[#22D3EE]">R$ {fmt(cartTotal)}</span></div>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-4 w-full text-sm">
              <p className="text-gray-400 mb-2">Indique um amigo e ganhe créditos!</p>
              <div className="flex items-center justify-between bg-[#0F172A] rounded-lg px-3 py-2">
                <span className="text-[#22D3EE] font-bold tracking-widest">{MY_REFERRAL_CODE}</span>
                <button onClick={() => copyText(MY_REFERRAL_CODE, setCopiedReferral)} className="text-xs text-gray-400 hover:text-[#22D3EE] flex items-center gap-1">
                  {copiedReferral ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReferral ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>
            <button
              onClick={resetAll}
              data-testid="button-finish"
              className="w-full py-4 bg-[#22D3EE] text-[#0F172A] font-bold rounded-xl hover:bg-[#06b6d4] transition-colors text-sm"
            >
              Voltar à loja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
