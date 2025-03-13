(() => {
  const favoritesKey = "lcw_favorite_products";
  const productsKey = "lcw_products";
  const jsonUrl =
    "https://gist.githubusercontent.com/sevindi/5765c5812bbc8238a38b3cf52f233651/raw/56261d81af8561bf0a7cf692fe572f9e1e91f372/products.json";
  const CARD_WIDTH = 240;
  const CARD_MARGIN = 20;

  let favorites = [];
  let products = [];
  let currentPosition = 0;
  let itemsPerView = 4;
  let carouselContent;
  let prevButton;
  let nextButton;

  const self = {
    init,
    loadFavorites,
    saveFavorites,
    isFavorite,
    toggleFavorite,
    loadProducts,
    createCarousel,
    updateItemsPerView,
    updateCarouselPosition,
    buildHTML,
    buildCSS,
  };

  async function init() {
    const productDetailElement = document.querySelector(".product-detail");
    if (!productDetailElement) {
      console.log("Not a product page, carousel will not be initialized.");
      return;
    }

    try {
      self.loadFavorites();
      const loadedProducts = await self.loadProducts();
      if (!loadedProducts || loadedProducts.length === 0) return;

      const carouselElement = self.createCarousel();
      if (!carouselElement) return;

      productDetailElement.parentNode.insertBefore(
        carouselElement,
        productDetailElement.nextSibling
      );
    } catch (error) {
      console.error("Carousel initialization error:", error);
    }
  }

  function loadFavorites() {
    try {
      const storedFavorites = localStorage.getItem(favoritesKey);
      if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
      }
    } catch (error) {
      favorites = [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    } catch (error) {}
  }

  function isFavorite(productId) {
    return favorites.includes(productId);
  }

  function toggleFavorite(productId) {
    const index = favorites.indexOf(productId);
    index > -1 ? favorites.splice(index, 1) : favorites.push(productId);
    self.saveFavorites();
  }

  async function loadProducts() {
    try {
      const storedProducts = localStorage.getItem(productsKey);
      if (storedProducts) {
        products = JSON.parse(storedProducts);
        return products;
      }

      const response = await fetch(jsonUrl);
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      products = data;
      localStorage.setItem(productsKey, JSON.stringify(products));
      return products;
    } catch (error) {
      return [];
    }
  }

  function buildHTML() {
    const existingCarousel = document.getElementById("lcw-product-carousel");
    if (existingCarousel) existingCarousel.remove();

    const carouselContainer = document.createElement("div");
    carouselContainer.id = "lcw-product-carousel";

    carouselContainer.innerHTML = `
        <div class="carousel-title-row">
          <h2 class="carousel-title">You Might Also Like</h2>
        </div>
        <div class="carousel-navigation-container">
          <button class="carousel-nav prev"></button>
          <div class="carousel-viewport">
            <div class="carousel-content"></div>
          </div>
          <button class="carousel-nav next"></button>
        </div>
      `;

    carouselContent = carouselContainer.querySelector(".carousel-content");
    prevButton = carouselContainer.querySelector(".carousel-nav.prev");
    nextButton = carouselContainer.querySelector(".carousel-nav.next");

    products.forEach((product) => {
      const card = createProductCard(product);
      carouselContent.appendChild(card);
    });

    prevButton.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
      `;

    nextButton.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6"></path>
        </svg>
      `;

    setupEventListeners(carouselContainer);

    return carouselContainer;
  }

  function createProductCard(product) {
    const isFav = self.isFavorite(product.id);
    const numericPrice = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(product.price);

    const card = document.createElement("div");
    card.className = `product-card product-${product.id}`;
    card.style.width = `${CARD_WIDTH}px`;
    card.style.minWidth = `${CARD_WIDTH}px`;

    card.innerHTML = `
        <div class="image-container">
          ${
            product.img
              ? `<img src="${product.img}" alt="${product.name}" loading="lazy">`
              : `<span>${product.name
                  .split(" ")
                  .map((word) => word.charAt(0))
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}</span>`
          }
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-price">${numericPrice} TRY</div>
        <div class="heart-icon ${isFav ? "favorite" : ""}">${
      isFav ? "♥" : "♡"
    }</div>
      `;

    const heartIcon = card.querySelector(".heart-icon");
    heartIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      self.toggleFavorite(product.id);
      const isFav = self.isFavorite(product.id);
      heartIcon.textContent = isFav ? "♥" : "♡";
      heartIcon.classList.toggle("favorite", isFav);
    });

    card.addEventListener("click", () => {
      if (product.url) {
        window.open(product.url, "_blank");
      } else {
        console.warn(
          `Cannot find url for product: ${product.id} - ${product.name}`
        );
      }
    });

    return card;
  }

  function setupEventListeners(container) {
    prevButton.addEventListener("click", () => {
      if (currentPosition > 0) {
        currentPosition--;
        self.updateCarouselPosition();
      }
    });

    nextButton.addEventListener("click", () => {
      if (currentPosition < products.length - itemsPerView) {
        currentPosition++;
        self.updateCarouselPosition();
      }
    });

    setTimeout(() => {
      self.updateItemsPerView();
      self.updateCarouselPosition();
    }, 100);
  }

  function buildCSS() {
    const css = `
        #lcw-product-carousel {
          width: 100%;
          max-width: 1200px;
          padding: 20px 30px;
          margin: 30px auto;
          display: flex;
          justify-content: center;
          flex-direction: column;
          box-sizing: border-box;
        }
        
        #lcw-product-carousel .carousel-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 15px 0px;
        }
        
        #lcw-product-carousel .carousel-title {
          font-size: 32px;
          color: #29323b;
          line-height: 33px;
          font-weight: lighter;
          padding: 15px 0;
          margin: 0;
        }
        
        #lcw-product-carousel .carousel-navigation-container {
          display: flex;
          align-items: center;
          position: relative;
          width: 100%;
        }
        
        #lcw-product-carousel .carousel-viewport {
          flex: 1;
          overflow: hidden;
          width: 100%;
          min-height: 300px;
          padding: 0 20px;
          position: relative;
          cursor: grab;
        }
        
        #lcw-product-carousel .carousel-content {
          display: flex;
          transition: transform 0.3s ease-in-out;
          width: max-content;
        }
        
        #lcw-product-carousel .product-card {
          flex: 0 0 auto;
          margin: 0 10px;
          padding: 0 0 15px 0;
          border: 1px solid #eee;
          border-radius: 0;
          box-sizing: border-box;
          cursor: pointer;
          position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
          overflow: hidden;
        }
      
        
        #lcw-product-carousel .image-container {
          width: 100%;
          height: 310px;
          background-color: #f5f5f5;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: #666;
          overflow: hidden;
          margin: 0;
          padding: 0;
          overflow-clip-margin: content-box;
        }
        
        #lcw-product-carousel .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
          margin: 0;
          padding: 0;
        }
        
        #lcw-product-carousel .product-name {
          font-size: 14px;
          font-family: 'Open Sans', sans-serif;
          font-weight: normal;
          color: #302E2B;
          margin: 0px 0px 10px;
          height: auto;
          overflow: visible;
          text-overflow: ellipsis;
          white-space: normal;
          word-wrap: break-word;
          padding-left: 15px;
          padding-right: 15px;
          line-height: 1.4;
        }
        
        #lcw-product-carousel .product-price {
          font-size: 18px;
          font-family: 'Open Sans', sans-serif;
          font-weight: bold;
          color: #193DB0;
          margin: 0px 0px 10px;
          padding-left: 15px;
          padding-right: 15px;
        }
        
        #lcw-product-carousel .heart-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          z-index: 2;
          background-color: rgba(255,255,255,0.7);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.2);
        }
        
        #lcw-product-carousel .heart-icon.favorite {
          color: #193DB0;
        }
        
        #lcw-product-carousel .carousel-nav {
          background-color: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          z-index: 5;
          user-select: none;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          flex-shrink: 0;
          position: relative;
          top: 50%;
          transform: translateY(-50%);
        }
        
        #lcw-product-carousel .carousel-nav.prev {
          left: -25px;
        }
        
        #lcw-product-carousel .carousel-nav.next {
          right: -25px;

        }
        
        @media (max-width: 1200px) {
          #lcw-product-carousel {
            padding: 20px 25px;
          }
        }
        
        @media (max-width: 768px) {
          #lcw-product-carousel .carousel-title {
            font-size: 28px;
          }
          #lcw-product-carousel .image-container {
            height: 280px;
          }
        }
        
        @media (max-width: 480px) {
          #lcw-product-carousel .carousel-title {
            font-size: 24px;
          }
          #lcw-product-carousel .image-container {
            height: 250px;
          }
          #lcw-product-carousel {
            min-width: 280px;
            padding: 10px 30px;
          }
          #lcw-product-carousel .carousel-viewport {
            min-width: ${CARD_WIDTH + 20}px;
          }
          #lcw-product-carousel .carousel-nav {
            width: 36px;
            height: 36px;
          }
          #lcw-product-carousel .carousel-nav.prev {
            left: -15px;
          }
          #lcw-product-carousel .carousel-nav.next {
            right: -15px;
          }
        }
      `;

    const existingStyle = document.querySelector("style.lcw-carousel-style");
    if (existingStyle) existingStyle.remove();

    const styleElement = document.createElement("style");
    styleElement.className = "lcw-carousel-style";
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }

  function createCarousel() {
    if (!products || products.length === 0) return null;

    const carouselContainer = self.buildHTML();
    self.buildCSS();
    return carouselContainer;
  }

  function updateItemsPerView() {
    const viewportWidth = window.innerWidth;
    const containerWidth = document.querySelector(
      "#lcw-product-carousel"
    ).offsetWidth;
    const totalCardWidth = CARD_WIDTH + CARD_MARGIN;

    let calculatedItemsPerView = Math.floor(
      (containerWidth - 80) / totalCardWidth
    );
    calculatedItemsPerView = Math.max(1, calculatedItemsPerView);

    itemsPerView = viewportWidth <= 480 ? 1 : calculatedItemsPerView;

    if (currentPosition > products.length - itemsPerView) {
      currentPosition = Math.max(0, products.length - itemsPerView);
    }
  }

  function updateCarouselPosition() {
    const totalCardWidth = CARD_WIDTH + CARD_MARGIN;
    const offset = currentPosition * totalCardWidth;
    carouselContent.style.transform = `translateX(-${offset}px)`;

    prevButton.style.display = currentPosition > 0 ? "flex" : "none";
    nextButton.style.display =
      currentPosition < products.length - itemsPerView ? "flex" : "none";
  }

  init();
})();
