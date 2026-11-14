const galleryImages = [
    {
        id: 'm31-lrgbha',
        title: 'The Andromeda Galaxy in LRGB and Hα',
        date: '2026-11-06',
        image: 'images/previews/m31-lrgbha.jpg',
        alt: 'The Andromeda Galaxy M31 with its companions M32 and M110, red hydrogen-alpha star-forming regions along its spiral arms',
        filters: 'LRGB + Hα',
        duration: '20 hours',
        categories: ['galaxies'],
        link: 'gallery/m31-lrgbha.html',
        detailImage: '../images/m31-lrgbha.jpg',
        webImage: '../images/web/m31-lrgbha.jpg',
        acquisition: [
            { filter: 'Luminance', exposure: '180s', count: 140, total: '7h' },
            { filter: 'Red', exposure: '180s', count: 46, total: '2h 18m' },
            { filter: 'Green', exposure: '180s', count: 46, total: '2h 18m' },
            { filter: 'Blue', exposure: '180s', count: 46, total: '2h 18m' },
            { filter: 'Hα (656nm)', exposure: '600s', count: 36, total: '6h' }
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Filter Wheel', value: 'ZWO EFW' },
            { label: 'Filters', value: 'Antlia V-Pro LRGB + Antlia 3nm Hα' },
            { label: 'Camera', value: 'ZWO ASI2600MM Pro' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'My second go at the Andromeda Galaxy, and the first with a mono camera and filters. Over three nights in early November 2026 I collected just under 20 hours: luminance and RGB on the first two nights, then six hours of hydrogen-alpha on the third.',
            'The Hα data brings out the pink star-forming regions strung along the spiral arms, which barely show in broadband color. M32 sits just beside the bright core, and the elongated M110 lies below the galaxy.',
            'After culling, 320 subs went into the stack, drizzled 2x and calibrated with flats and bias. I processed it in PixInsight, adding the continuum-subtracted Hα to the spiral arms and handling the stars separately from the galaxy.'
        ]
    },
    {
        id: 'milky-way-minas-de-san-jose',
        title: 'Winter Milky Way above Minas de San José in Tenerife',
        date: '2026-02-20',
        image: 'images/previews/mw-tenerife-2.jpg',
        alt: 'Winter Milky Way rising above volcanic formations in Minas de San José, Teide National Park, Tenerife',
        filters: 'RGB',
        duration: '48 minutes',
        categories: ['widefield'],
        link: 'gallery/milky-way-minas-de-san-jose.html',
        detailImage: '../images/mw-tenerife-2.jpg',
        webImage: '../images/web/mw-tenerife-2.jpg',
        acquisition: [
            { filter: 'None', exposure: '90s', count: '32', total: '48m' },
        ],
        equipment: [
            { label: 'Lens', value: 'Sigma 16mm F1.4' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'SkyWatcher Star Adventurer 2i' }
        ],
        description: [
            'During a week in Tenerife I spent one night photographing in Minas de San José, a volcanic area in Teide National Park at an elevation of roughly 2200 meters. The landscape there is scattered with lava formations and small shrubs shaped by past eruptions from Mount Teide and the surrounding volcanic fields. The park is well known for its dark skies and high elevation, making it a popular location for night sky photography.',
            'In February the galactic core only rises modestly above the southern horizon from this latitude. During this session it reached roughly 20–25 degrees above the horizon before dawn, gradually revealing more of the central Milky Way and its dust lanes as it cleared the distant volcanic ridges.',
            'While setting up that night I discovered that the intervalometer I had brought had a faulty cable, which meant running an automated sequence was not possible. Instead I used a shutter release with a hold function and triggered each exposure manually while staying beside the camera throughout the sequence.',
            'In total I captured 49 exposures during the night. Because the foreground terrain covered a significant portion of the Milky Way in the earliest frames, I ultimately selected 32 exposures that best matched the final composition as the galaxy climbed higher in the sky.'
        ]
    },
    {
        id: 'ngc7000',
        title: 'The Cygnus Wall in NGC 7000',
        date: '2025-09-24',
        image: 'images/previews/NGC7000.jpg',
        alt: 'The Cygnus Wall in the North America Nebula, NGC 7000, in the SHO palette',
        filters: 'SHO',
        duration: '6 hours',
        categories: ['nebulae'],
        link: 'gallery/ngc7000.html',
        detailImage: '../images/NGC7000.jpg',
        webImage: '../images/web/NGC7000.jpg',
        acquisition: [
            { filter: 'Hα (656nm)', exposure: '300s', count: 30, total: '2.5h' },
            { filter: 'SII (672nm)', exposure: '300s', count: 30, total: '2.5h' },
            { filter: 'OIII (501nm)', exposure: '300s', count: 12, total: '1h' }
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Filter Wheel', value: 'ZWO EFW' },
            { label: 'Filters', value: 'Antlia 3nm SHO + Antlia V-Pro LRGB' },
            { label: 'Camera', value: 'ZWO ASI2600MM Pro' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'The Cygnus Wall is the bright ridge of gas along the edge of the North America Nebula, in the part that looks like Mexico and Central America on a map. New stars are forming inside it.',
            'I shot it with narrowband filters on my ASI2600MM Pro: 2.5 hours each of Hα and SII and one hour of OIII, about 6 hours in total.',
            'The colors use the SHO palette, also called the Hubble palette, with sulfur shown as red, hydrogen as green and oxygen as blue.'
        ]
    },
    {
        id: 'bodes-cigar',
        title: 'Bode\u2019s Galaxy and the Cigar Galaxy in Ursa Major',
        date: '2025-02-23',
        image: 'images/previews/bodes-cigar.jpg',
        alt: 'Bode\u2019s Galaxy and the Cigar Galaxy in Ursa Major',
        filters: 'RGB',
        duration: '15 hours',
        categories: ['galaxies'],
        link: 'gallery/bodes-cigar.html',
        detailImage: '../images/bodes-cigar.jpg',
        webImage: '../images/web/bodes-cigar.jpg',
        acquisition: [
            { filter: 'None', exposure: '300s', count: 178, total: '15h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'Bode\u2019s Galaxy (M81) and the Cigar Galaxy (M82) sit close together in Ursa Major, so both fit in one frame with the FF65. They are about 12 million light-years away.',
            'M81 is a big spiral galaxy. M82 is seen almost edge-on and is forming stars very quickly after a close encounter with M81.',
            'I took it with my Sony A6000: 178 exposures of 5 minutes, close to 15 hours in total.'
        ]
    },
    {
        id: 'm33',
        title: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        date: '2024-12-08',
        image: 'images/previews/m33.jpg',
        alt: 'The Triangulum Galaxy, a Spiral Galaxy in Triangulum',
        filters: 'RGB',
        duration: '22.5 hours',
        categories: ['galaxies'],
        link: 'gallery/m33.html',
        detailImage: '../images/m33.jpg',
        webImage: '../images/web/m33.jpg',
        acquisition: [
            { filter: 'None', exposure: '300s', count: 270, total: '22.5h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'The Triangulum Galaxy (M33) is the third largest galaxy in our Local Group, after Andromeda and the Milky Way. It is spread out and faint, so it needs a lot of exposure time.',
            'Its loose spiral arms are full of star-forming regions. The largest one, NGC 604, is one of the biggest known.',
            'I gave it 270 exposures of 5 minutes, 22.5 hours in total, with my Sony A6000 on the FF65.'
        ]
    },
    {
        id: 'm31',
        title: 'The Andromeda Galaxy with a Sony A6000',
        date: '2024-11-02',
        image: 'images/previews/m31.jpg',
        alt: 'The Andromeda Galaxy M31 with its companions M32 and M110, photographed with a Sony A6000',
        filters: 'RGB',
        duration: '9 hours',
        categories: ['galaxies'],
        link: 'gallery/m31.html',
        detailImage: '../images/m31.jpg',
        webImage: '../images/web/m31.jpg',
        acquisition: [
            { filter: 'None', exposure: '240s', count: 136, total: '9h' },
        ],
        equipment: [
            { label: 'Telescope', value: 'ZWO FF65 APO' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'ZWO AM5N' }
        ],
        description: [
            'My first go at the Andromeda Galaxy, taken a month after I got my first telescope. I used my Sony A6000 on the FF65: 136 exposures of 4 minutes, 9 hours in total.',
            'Andromeda is the closest large spiral galaxy to us, about 2.5 million light-years away. Two of its small companion galaxies are in the frame too: M32 close to the core and M110 below it.',
            'In 2026 I went back with a mono camera and filters. You can see the result in <a href="m31-lrgbha">The Andromeda Galaxy in LRGB and Hα</a>.'
        ]
    },
    {
        id: 'mw-tenerife',
        title: 'Milky Way from Tenerife',
        date: '2024-02-26',
        image: 'images/previews/mw-tenerife.jpg',
        alt: 'The core of the Milky Way above a rock formation in Teide National Park, Tenerife',
        filters: 'RGB',
        duration: '1 hour',
        categories: ['widefield'],
        link: 'gallery/mw-tenerife.html',
        detailImage: '../images/mw-tenerife.jpg',
        webImage: '../images/web/mw-tenerife.jpg',
        acquisition: [
            { filter: 'None', exposure: '101s', count: 42, total: '1h' },
        ],
        equipment: [
            { label: 'Lens', value: 'Sigma 16mm F1.4' },
            { label: 'Camera', value: 'Sony A6000' },
            { label: 'Mount', value: 'SkyWatcher Star Adventurer 2i' }
        ],
        description: [
            'I took this on a trip to Tenerife, from Teide National Park more than 2,000 meters up. The skies there are dark and the air is often very clear, which makes it a great place for night sky photos.',
            'It shows the core of the Milky Way with its dark dust lanes. It is 42 exposures of 101 seconds, just over an hour in total, with my Sony A6000 and a Sigma 16mm F1.4 on a Star Adventurer 2i tracker.'
        ]
    },
];
