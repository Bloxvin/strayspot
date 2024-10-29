const galleryGrid = document.getElementById('galleryGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const MAX_KEYS_TO_BE_SENT = 100;

//   const images = [
//     { id: 1, src: '/placeholder.svg?height=400&width=400', likes: 120, comments: 15 },
//     { id: 2, src: '/placeholder.svg?height=400&width=400', likes: 85, comments: 8 },
//     { id: 3, src: '/placeholder.svg?height=400&width=400', likes: 200, comments: 32 },
//     { id: 4, src: '/placeholder.svg?height=400&width=400', likes: 150, comments: 20 },
//     { id: 5, src: '/placeholder.svg?height=400&width=400', likes: 95, comments: 12 },
//     { id: 6, src: '/placeholder.svg?height=400&width=400', likes: 180, comments: 25 },
// ];


function createGalleryItem(src) {
    return `
        <div class="card">
            <div class="card-content">
                <img src="${src}" alt="Cat ${"Cat Image"}">
            </div>
            <div class="card-footer">
                <div class="action-buttons">
                    <button aria-label="Like">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </button>
                    <span>${src.likes || '0'}</span>
                    <button aria-label="Comment">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </button>
                    <span>${src.comments || '0'}</span>
                </div>
                <div class="action-buttons">
                    <button aria-label="Share">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                    <button aria-label="Bookmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function loadImages(maxKeys) {

  const response = await fetch(`/images?maxKeys=${maxKeys}`);

  if (!response.ok) {
    console.error('Failed to fetch images:', response.statusText);
    return;
  }

  const imageKeys = await response.json();

  imageKeys.forEach(async (key) => {
    const urlResponse = await fetch(`/image-url?key=${key}`);
    if (urlResponse.ok) {
        urlResponse.json().then( data => {
            console.log(data);
            galleryGrid.innerHTML += createGalleryItem(data.url);
        })
    } else {
        console.error('Failed to fetch pre-signed URL:', urlResponse.statusText);
    }
  });

}


loadMoreBtn.addEventListener('click', () => {
    // In a real application, this would load more images from a server
    alert('Load more images functionality would be implemented here.');
});

loadImages(MAX_KEYS_TO_BE_SENT);