# 버그없음 마켓

개발자를 위한, 개발자가 만든 굿즈 쇼핑몰. 포트폴리오용 데모 — **실제 결제·배송 없음**.

**🔗 Live: [dev-goods-shop.vercel.app](https://dev-goods-shop.vercel.app)**

## 기능

- 상품 목록 (`products.js`에 객체만 추가하면 자동 반영)
- 장바구니: 담기/수량조절/삭제, localStorage에 저장
- 체크아웃: 배송정보 입력 → 서버리스 함수(`/api/orders`)가 Vercel Blob에 주문 기록 → 주문번호 발급
- 실제로 동작하는 주문 접수까지 있지만 결제·배송은 전혀 처리하지 않는 순수 데모

## 스택

빌드 도구 없는 순수 정적 사이트(`index.html`/`styles.css`/`app.js`/`products.js`) + Vercel 서버리스 함수 1개 + Vercel Blob(주문 저장, append-only).
