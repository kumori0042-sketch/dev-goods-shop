(function () {
  "use strict";

  const LS_CART = "shop_cart"; // { [productId]: qty }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(LS_CART) || "{}");
    } catch (e) {
      return {};
    }
  }
  function saveCart(cart) {
    localStorage.setItem(LS_CART, JSON.stringify(cart));
  }
  function findProduct(id) {
    return PRODUCTS.find((p) => p.id === id);
  }
  function fmtWon(n) {
    return n.toLocaleString("ko-KR") + "원";
  }

  // ---------- 상품 목록 ----------
  const grid = document.getElementById("product-grid");
  function renderProducts() {
    const countEl = document.getElementById("product-count");
    if (countEl) countEl.textContent = PRODUCTS.length + "개";
    grid.innerHTML = PRODUCTS.map(
      (p) => `
      <div class="product-card">
        <div class="product-media">${p.emoji}</div>
        <div class="product-body">
          <span class="product-tag">${p.tag}</span>
          <p class="product-name">${p.name}</p>
          <p class="product-tagline">${p.tagline}</p>
          <div class="product-foot">
            <span class="product-price mono">${fmtWon(p.price)}</span>
            <button type="button" class="btn-add" data-id="${p.id}">담기</button>
          </div>
        </div>
      </div>`
    ).join("");

    grid.querySelectorAll(".btn-add").forEach((btn) => {
      btn.addEventListener("click", () => {
        addToCart(btn.dataset.id);
        btn.textContent = "담김!";
        btn.classList.add("added");
        setTimeout(() => {
          btn.textContent = "담기";
          btn.classList.remove("added");
        }, 900);
      });
    });
  }

  function addToCart(id) {
    const cart = getCart();
    cart[id] = (cart[id] || 0) + 1;
    saveCart(cart);
    renderCartBadge();
  }
  function setQty(id, qty) {
    const cart = getCart();
    if (qty <= 0) delete cart[id];
    else cart[id] = qty;
    saveCart(cart);
    renderCartBadge();
    renderCartDrawer();
  }

  function renderCartBadge() {
    const cart = getCart();
    const count = Object.values(cart).reduce((a, b) => a + b, 0);
    const badge = document.getElementById("cart-count");
    badge.textContent = count;
    badge.hidden = count === 0;
  }

  function cartLines() {
    const cart = getCart();
    return Object.entries(cart)
      .map(([id, qty]) => ({ product: findProduct(id), qty }))
      .filter((l) => l.product);
  }
  function cartTotal() {
    return cartLines().reduce((sum, l) => sum + l.product.price * l.qty, 0);
  }

  // ---------- 장바구니 드로어 ----------
  const cartBackdrop = document.getElementById("cart-backdrop");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");

  function renderCartDrawer() {
    const lines = cartLines();
    if (lines.length === 0) {
      cartItemsEl.innerHTML = `<div class="empty-cart">장바구니가 비어있어요.<br>마음에 드는 굿즈를 담아보세요.</div>`;
    } else {
      cartItemsEl.innerHTML = lines
        .map(
          (l) => `
        <div class="cart-item" data-id="${l.product.id}">
          <div class="cart-item-media">${l.product.emoji}</div>
          <div class="cart-item-info">
            <p class="cart-item-name">${l.product.name}</p>
            <span class="cart-item-price mono">${fmtWon(l.product.price)}</span>
            <div class="qty-row">
              <button type="button" class="qty-btn" data-action="dec">−</button>
              <span class="qty-val">${l.qty}</span>
              <button type="button" class="qty-btn" data-action="inc">+</button>
              <button type="button" class="remove-btn" data-action="remove">삭제</button>
            </div>
          </div>
        </div>`
        )
        .join("");

      cartItemsEl.querySelectorAll(".cart-item").forEach((row) => {
        const id = row.dataset.id;
        const cart = getCart();
        row.querySelector('[data-action="inc"]').addEventListener("click", () => setQty(id, (cart[id] || 0) + 1));
        row.querySelector('[data-action="dec"]').addEventListener("click", () => setQty(id, (cart[id] || 0) - 1));
        row.querySelector('[data-action="remove"]').addEventListener("click", () => setQty(id, 0));
      });
    }
    cartTotalEl.textContent = fmtWon(cartTotal());
    document.getElementById("btn-checkout").disabled = lines.length === 0;
  }

  document.getElementById("btn-open-cart").addEventListener("click", () => {
    renderCartDrawer();
    cartBackdrop.hidden = false;
  });
  document.getElementById("btn-close-cart").addEventListener("click", () => (cartBackdrop.hidden = true));
  cartBackdrop.addEventListener("click", (e) => {
    if (e.target === cartBackdrop) cartBackdrop.hidden = true;
  });

  // ---------- 체크아웃 ----------
  const checkoutBackdrop = document.getElementById("checkout-backdrop");
  const summaryEl = document.getElementById("checkout-summary");

  document.getElementById("btn-checkout").addEventListener("click", () => {
    const lines = cartLines();
    if (lines.length === 0) return;
    summaryEl.innerHTML =
      lines
        .map((l) => `<div class="row"><span>${l.product.name} × ${l.qty}</span><span class="mono">${fmtWon(l.product.price * l.qty)}</span></div>`)
        .join("") + `<div class="row total"><span>합계</span><span class="mono">${fmtWon(cartTotal())}</span></div>`;
    document.getElementById("btn-place-order").textContent = `${fmtWon(cartTotal())} 결제하기 (모의)`;
    cartBackdrop.hidden = true;
    checkoutBackdrop.hidden = false;
  });
  document.getElementById("btn-close-checkout").addEventListener("click", () => (checkoutBackdrop.hidden = true));
  checkoutBackdrop.addEventListener("click", (e) => {
    if (e.target === checkoutBackdrop) checkoutBackdrop.hidden = true;
  });

  document.getElementById("btn-place-order").addEventListener("click", async () => {
    const name = document.getElementById("ck-name").value.trim();
    const address = document.getElementById("ck-address").value.trim();
    const statusEl = document.getElementById("checkout-status");
    const lines = cartLines();

    if (!name || !address) {
      statusEl.textContent = "받는 사람과 배송지를 입력해주세요.";
      statusEl.hidden = false;
      statusEl.classList.add("error");
      return;
    }

    const btn = document.getElementById("btn-place-order");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "처리 중...";

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          items: lines.map((l) => ({ id: l.product.id, name: l.product.name, qty: l.qty, price: l.product.price })),
          total: cartTotal()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "주문 실패");

      saveCart({});
      renderCartBadge();
      checkoutBackdrop.hidden = true;
      document.getElementById("order-id").textContent = "주문번호 " + data.orderId;
      document.getElementById("done-backdrop").hidden = false;
    } catch (err) {
      statusEl.textContent = "주문 처리 중 문제가 생겼어요: " + err.message;
      statusEl.hidden = false;
      statusEl.classList.add("error");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  document.getElementById("btn-done-close").addEventListener("click", () => {
    document.getElementById("done-backdrop").hidden = true;
  });

  renderProducts();
  renderCartBadge();
})();
