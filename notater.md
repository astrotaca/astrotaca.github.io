<ul> = unordered list, lager en uordnet liste,
<ol> = ordered list, lager en nummerert liste,
<li> = list item, et punkt i en liste,
<a> = anchor, lager en lenke,
<p> = paragraph, lager et avsnitt med tekst,
<h1> til <h6> = heading, overskrifter i ulike nivåer,
<img> = image, viser et bilde,
<div> = division, en generell beholder for innhold,
<span> = inline container, beholder for små tekst- eller stil-elementer,
<nav> = navigation, område for navigasjonslenker,
<section> = section, en innholdsseksjon på siden,
<header> = header, toppområde for en seksjon eller side,
<footer> = footer, bunnområde for en seksjon eller side,
<main> = main, markerer hovedinnholdet på siden.

Veldig smart struktur av headers, da kan jeg gjøre sånn i CSS:

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-heading);
    line-height: 1.3;
    margin-bottom: 1rem;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.2rem; }
h4 { font-size: 1.08rem; }
h5 { font-size: 1.04rem; }
h6 { font-size: 1rem; }

p {
    margin-bottom: 1rem;
}

CSS REGLER:
z-index bestemmer hvilket element som ligger «oppå» andre når de overlapper hverandre på skjermen.

Høyere z-index = foran, lavere = bak.