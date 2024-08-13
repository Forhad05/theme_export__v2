// recently viewed products
if (!customElements.get('recently-viewed')) {
  customElements.define(
    'recently-viewed',
    class RecentlyViewedProducts extends HTMLElement {
      constructor() {
        super();
        this.productId = this.dataset.productId;
        this.productHandle = this.dataset.productHandle;
        this.recentlyViewedContainer = this.querySelector('#productGrid');
        this.numberOfProducts = parseInt(this.dataset.showProducts);

        document.addEventListener('DOMContentLoaded', () => {
          this.renderProduct();
          this.getListProduct() && this.getviewedProducts(this.getListProduct());
        });
      }

      getListProduct() {
        let data = localStorage.getItem('recently-viewed-storage');
        data = JSON.parse(data);
        return data;
      }

      setListProduct(product) {
        let data = localStorage.getItem('recently-viewed-storage');
        if (data !== null && data !== '{}' && data !== '[null]') {
          data = JSON.parse(data);
        } else {
          data = [];
        }

        const productWithId = {
          [this.productId]: product
        };

        const duplicateItem = data.find(item => Object.keys(item)[0] === Object.keys(productWithId)[0]);
        if(duplicateItem) data = data.filter(item => item !== duplicateItem);

        data.unshift(productWithId);
        if (data.length >= this.numberOfProducts) data = data.slice(0, this.numberOfProducts);
        localStorage.setItem('recently-viewed-storage', JSON.stringify(data));
      }

      async renderProduct() {
        const product = `/products/${this.productHandle}`;
        const headers = {
          'Content-Type': 'application/json',
          Accept: `application/json`
        };

        // const adminApi = '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';
        // const headers = {
        //   'X-Shopify-Access-Token': adminApi,
        //   'Content-Type': 'application/json',
        //   Accept: `application/json`
        // };

        // Fetch product data using productId
        fetch(product, {headers})
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(productData => {
            this.setListProduct(productData);
          })
          .catch(error => {
            console.error('There was a problem fetching the product:', error);
          });
      }

      fetchProductCardHTML(handle) {
        const productTileTemplateUrl = `/products/${handle}`;
        return fetch(productTileTemplateUrl)
        .then((res) => res.text())
        .then((res) => {
          const text = res;
          const parser = new DOMParser();
          const htmlDocument = parser.parseFromString(text, 'text/html');
          const productCard = htmlDocument.documentElement.querySelector('recently-viewed-card .product-card-wrapper');
          return productCard;
        })
        .catch((err) => console.error(`[Shopify Recently Viewed] Failed to load content for handle: ${handle}`, err));
      }

      async getviewedProducts(data) {
        if(this.dataset.designMode === 'true') {
          if(data.length >= 2) {
            this.querySelector('recently-viewed-card').classList.add('hidden');
          } else {
            this.querySelector('#productGrid').classList.add('hidden');
          }
        } else {
          this.closest('.shopify-section').style.display = data.length >= 2 ? 'block' : 'none';
        }
        if(!data.length >= 2) return;
        try {
          const handles = [];
          data.forEach((item) => {
            const product = item[Object.keys(item)[0]];
            if(product && product.product && product.product.handle) handles.push(product.product.handle);
          });

          const productCardPromises = handles.map(handle => this.fetchProductCardHTML(handle));

          const productCards = await Promise.all(productCardPromises);
          productCards.forEach((productCard, index) => {
            if (productCard) {
              const productGrid = document.createElement('div');
              if(this.dataset.animation === 'false') {
                productGrid.classList.add('grid__item');
              } else {
                productGrid.classList.add('grid__item', 'scroll-trigger', 'animate--slide-in');
                productGrid.setAttribute('data-cascade', '');
                productGrid.style.setProperty('--animation-order', `${index}`);
              }
              productGrid.appendChild(productCard);
              this.recentlyViewedContainer.appendChild(productGrid);
            }
          });
        } catch (err) {
          console.error('[Shopify recently viewed] Error fetching product cards:', err);
        } finally {
          this.setAttribute('aria-expanded', 'true');
        }
      }
    }
  );
}