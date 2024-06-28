const btnSearch = document.querySelector('.btn-search');
const userInput = document.getElementById('user-input');
const main = document.querySelector('main');
const cards = document.querySelector('.cards');
const errorRequest = document.querySelector('.error-request');
const headerTitle = document.querySelector('.header-wrapper__title');

const patternUrl = /^https:\/\/covers\.openlibrary\.org\/b\/isbn\/([a-z0-9]+)-([A-Z])\.jpg/i;

const max = 300;
const min = 100;

//Отображение html страницы
async function displayBooks(title, author, publishYyear, publishPlace, urlPoster, price) {
    const bookCard = document.createElement('div');
    const bookTitle = document.createElement('h3');
    const bookAuthor = document.createElement('div');
    const bookPublish = document.createElement('div');
    const bookPoster = document.createElement('img');
    const bookPrice = document.createElement('div');
    const btnBuy = document.createElement('button');

    bookCard.classList.add('card');
    bookPoster.classList.add('img-poster');
    bookPrice.classList.add('book-price');
    btnBuy.classList.add('btn-buy');

    bookTitle.textContent = title;
    bookAuthor.innerHTML = '<span class="highlight">Автор: </span>' + author;
    bookPublish.innerHTML = '<span class="highlight">Публикация: </span>' + (!publishPlace ? publishYyear + ' г.' : [publishYyear + ' г.' + ' ' + publishPlace]);
    bookPrice.textContent = 'Цена: ' + price + '$';
    btnBuy.textContent = 'Купить';

    //Если в urlPoster приходит null - беру дефолтную обложку
    if (!urlPoster) {
        bookPoster.setAttribute('src', './assets/images/default-cover.jpg')
    } else {
        bookPoster.setAttribute('src', urlPoster)
    }
    bookCard.appendChild(bookPoster);
    bookCard.appendChild(bookTitle);
    bookCard.appendChild(bookAuthor);
    bookCard.appendChild(bookPublish);
    bookCard.appendChild(bookPrice);
    bookCard.appendChild(btnBuy);

    cards.appendChild(bookCard);
}

//Получаю рендомную цену
const getPrice = () => Math.floor(Math.random() * (max - min + 1) + min);

//Получаю url обложки или null (делаю проверку на соответствие региксу)
async function getURLPoster(number) {
    const response = await fetch(`https://covers.openlibrary.org/b/isbn/${number}-M.jpg`)
    return !patternUrl.test(response.url) ? response.url : null
}

//Событие по клику на кнопку "Поиск"
btnSearch.addEventListener('click', async function () {
    const loader = document.querySelector('.loader');

    loader.classList.remove('loader-hidden');
    cards.innerHTML = '';
    errorRequest.innerHTML = '';

    try {
        const response = await fetch('https://openlibrary.org/search.json?author=' + userInput.value + '&sort=new');
        if (!response.ok) {
            throw new Error('Ошибка сети');
        }
        const data = await response.json();
        const dataArray = data.docs;

        if (dataArray.length === 0) {
            throw new Error('Нет результатов для данного автора');
        }

        let count = 0;
        for (let book of dataArray) {
            if (count > 19) break;

            //проверка на то что ключ isbn есть в объекте book
            const urlPoster = 'isbn' in book ? await getURLPoster(book.isbn[0]) : null;

            const price = getPrice()

            loader.classList.add('loader-hidden');
            main.classList.remove('main-hidden');

            await displayBooks(
                book.title, book.author_name, book.publish_year,
                book.publish_place, urlPoster, price)

            count++;
        }
    }
    catch (error) {
        console.log('Ошибка при получении данных:', error.message);

        loader.classList.add('loader-hidden');
        main.classList.remove('main-hidden');
        errorRequest.classList.remove('error-request-hidden');
        errorRequest.textContent = 'Сервер временно не доступен/ такого автора нет';
    }
    finally {
        console.log('>>>', 'Процесс завершен');
    }
})

//Клик на Лого bookBazaar в header возвращат на основную страницу
headerTitle.addEventListener('click', function () {
    userInput.value = '';
    cards.innerHTML = '';
    errorRequest.innerHTML = '';
    main.classList.add('main-hidden');
})


// Recomendations
document.addEventListener('DOMContentLoaded', function () {
    const recommendationsApiUrl = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction';
    const discountsApiUrl = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction';
    const newsApiUrl = 'https://www.googleapis.com/books/v1/volumes?q=subject:fiction';

    const fetchBooks = (url, carouselId) => {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const carousel = document.getElementById(carouselId);
                const booksHtml = data.items.map(item => {
                    const book = item.volumeInfo;
                    const coverImage = book.imageLinks ? book.imageLinks.thumbnail : 'https://via.placeholder.com/128x192.png?text=No+Image';
                    return `
                  <div class="carousel-item" data-id="${item.id}" data-carousel="${carouselId}">
                      <img src="${coverImage}" alt="${book.title}">
                      <div class="book-info">
                          <h5>${book.title}</h5>
                          <p>${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                      </div>
                  </div>
              `;
                }).join('');
                carousel.innerHTML = booksHtml;
                addCarouselEventListeners(carouselId); // Adding event listeners after the books are loaded
            })
            .catch(error => console.error('Error fetching books:', error));
    };

    const addCarouselEventListeners = (carouselId) => {
        const carousel = document.getElementById(carouselId);
        carousel.querySelectorAll('.carousel-item').forEach(item => {
            item.addEventListener('click', () => {
                showBookDetails(item.dataset.id, carouselId); // Passing carouselId to showBookDetails
            });
        });
    };

    const showBookDetails = (bookId, carouselId) => {
        const url = `https://www.googleapis.com/books/v1/volumes/${bookId}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const book = data.volumeInfo;
                const coverImage = book.imageLinks ? book.imageLinks.thumbnail : 'https://via.placeholder.com/128x192.png?text=No+Image';
                const bookDetailsHtml = `
                  <div class="book-details">
                      <img src="${coverImage}" alt="${book.title}">
                      <div class="info">
                          <h2>${book.title}</h2>
                          <p>${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                          <p>${book.description}</p>
                          <button onclick="addToCart('${bookId}')">В корзину</button>
                      </div>
                  </div>
              `;
                const detailsContainer = document.createElement('div');
                detailsContainer.innerHTML = bookDetailsHtml;
                const carouselContainer = document.getElementById(carouselId).parentElement;
                carouselContainer.innerHTML = ''; // Clear the carousel
                carouselContainer.appendChild(detailsContainer); // Display the book details
            })
            .catch(error => console.error('Error fetching book details:', error));
    };

    const addToCart = (bookId) => {
        // Logic to add the book to the cart and store in local storage
        console.log(`Adding book with ID ${bookId} to cart`);
    };

    const setupCarouselControls = (prevBtnId, nextBtnId, carouselId) => {
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        const carousel = document.getElementById(carouselId);

        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
        });
    };

    fetchBooks(recommendationsApiUrl, 'bookCarousel');
    fetchBooks(discountsApiUrl, 'discountCarousel');
    fetchBooks(newsApiUrl, 'newCarousel');

    setupCarouselControls('prevBtn', 'nextBtn', 'bookCarousel');
    setupCarouselControls('discountPrevBtn', 'discountNextBtn', 'discountCarousel');
    setupCarouselControls('newPrevBtn', 'newNextBtn', 'newCarousel');
});
