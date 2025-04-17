---
layout: page
title: Gallery
icon: fas fa-images
permalink: /gallery/
order: 4
---

<style>
/* Gallery Grid */
.gallery-grid {
  display: block; /* Stack the items vertically */
  margin-top: 2rem;
  max-width: 1200px; /* Limit width on larger screens */
  margin-left: auto; /* Center the grid */
  margin-right: auto; /* Center the grid */
  padding: 0 1rem; /* Add some padding on the sides */
}

/* Image Styling */
.gallery-item {
  margin-bottom: 2rem; /* Add space between images */
}

.gallery-grid img {
  width: 100%;  /* Makes the image fill the container */
  height: auto; /* Maintains aspect ratio */
  border-radius: 1rem; /* Soft corners */
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); /* Soft shadow effect */
  transition: transform 0.2s ease;
}

/* Hover effect for images */
.gallery-grid img:hover {
  transform: scale(1.02);
}

/* Optional: Title and Description Style (if included below the image) */
.gallery-item-body {
  text-align: center;
  padding: 0.5rem;
}

.gallery-item-title {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.gallery-item-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
}
</style>

<!-- Gallery Grid -->
<div class="gallery-grid">
  {% assign gallery = site.data.gallery %}
  {% for item in gallery %}
    <div class="gallery-item">
      <!-- Image with alt text and optional title/description -->
      <img src="{{ item.image | relative_url }}" alt="{{ item.title }}" loading="lazy">
      <div class="gallery-item-body">
        <div class="gallery-item-title">{{ item.title }}</div>
        <div class="gallery-item-desc">{{ item.description }}</div>
      </div>
    </div>
  {% endfor %}
</div>
