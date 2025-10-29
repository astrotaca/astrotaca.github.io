// guides data
const guidesData = [
{
    id: 'sleep-while-using-telescope-nina',
    title: 'Sleep While Using Your Telescope: A Guide to NINA',
    category: 'advanced',
    image: 'guides/previews/sleep-while-using-telescope-nina-preview.jpg',
    shortDescription: 'Building NINA sequences that handle target acquisition through shutdown, manage failures automatically, and let you sleep while imaging.',
    link: 'guides/sleep-while-using-telescope-nina.html',
    detailImage: '../guides/sleep-while-using-telescope-nina.jpg',
    fullContent: [
        {
            type: 'paragraph',
            content: 'This guide covers building NINA sequences that handle target acquisition through shutdown, manage failures automatically, and let you sleep while imaging.'
        },
        {
            type: 'paragraph',
            content: '<strong>Prerequisites:</strong> You should know how to connect your equipment to NINA and run a basic sequence. This guide focuses on building reliable, unattended automation.'
        },
        {
            type: 'heading',
            content: 'What NINA Does'
        },
        {
            type: 'paragraph',
            content: 'NINA is sequencing software. It controls your mount, camera, focuser, filter wheel, and guider to execute a defined plan.'
        },
        {
            type: 'paragraph',
            content: 'The <strong>Advanced Sequencer</strong> uses three container types:'
        },
        {
            type: 'list',
            items: [
                '<strong>Sequential containers</strong> execute instructions top to bottom',
                '<strong>Parallel containers</strong> run multiple instructions simultaneously',
                '<strong>Deep Sky Object containers</strong> hold target-specific coordinates and settings'
            ]
        },
        {
            type: 'paragraph',
            content: 'Within containers, you add <strong>instructions</strong> (commands), <strong>triggers</strong> (event-driven actions), and <strong>loop conditions</strong> (criteria for when to continue or stop).'
        },
        {
            type: 'heading',
            content: 'Critical Components for Automation'
        },
        {
            type: 'heading',
            content: 'Triggers: Event-Driven Actions'
        },
        {
            type: 'paragraph',
            content: 'Triggers fire automatically when conditions are met. They evaluate after every instruction and execute without stopping the sequence.'
        },
        {
            type: 'list',
            items: [
                '<strong>AF After HFR Increase</strong> Monitors star sharpness and refocuses automatically when HFR exceeds your threshold.',
                '<strong>AF After Temperature Change</strong> Refocuses when ambient temperature shifts.',
                '<strong>Center After Drift</strong> Plate solves periodically and recenters if the target drifts.',
                '<strong>Meridian Flip</strong> Handles flips when crossing the meridian.',
                '<strong>Settle Before Exposure</strong> Waits for guiding to stabilize before exposures.',
                '<strong>Restore Guiding</strong> Automatically restarts guiding if it stops.'
            ]
        },
        {
            type: 'heading',
            content: 'Loop Conditions: When to Continue'
        },
        {
            type: 'paragraph',
            content: 'Loop conditions determine whether a container repeats. Multiple conditions stack (all must remain true).'
        },
        {
            type: 'list',
            items: [
                '<strong>Loop Until Time</strong>: Stops at Nautical Dawn or Astronomical Dawn.',
                '<strong>Loop While Altitude Above Horizon</strong>: Stops when the target drops below your horizon limit.'
            ]
        },
        {
            type: 'paragraph',
            content: 'Example: Loop Until Time (Nautical Dawn) AND Loop While Altitude Above Horizon.'
        },
        {
            type: 'heading',
            content: 'Filter Offsets'
        },
        {
            type: 'paragraph',
            content: 'Filter offsets let NINA adjust focus instantly when switching filters. Use the Filter Offset Calculator plugin to set this up once and save time.'
        },
        {
            type: 'heading',
            content: 'Target Sequence Structure'
        },
        {
            type: 'paragraph',
            content: 'Here’s how I structure my LRGB target sequences:'
        },
        {
            type: 'list',
            items: [
                'Global Trigger: Meridian Flip',
                'Target-Level Triggers: Restore Guiding, Center After Drift, AF After Temp Change, AF After HFR Increase',
                'Loop Conditions: Until Nautical Dawn, While Altitude Above Horizon',
                'Instructions: Wait until above horizon, Run Autofocus, Slew and Center, Set Tracking, Start Guiding',
                'Imaging: LRGB exposures with dithering'
            ]
        },
        {
            type: 'image',
            src: '/guides/nina-sequence-sleep.jpg',
            alt: 'LRGB target sequence structure in NINA'
        },
        {
            type: 'heading',
            content: 'Key Design Decisions'
        },
        {
            type: 'list',
            items: [
                '3L : 1R : 1G : 1B ratio for efficiency',
                'Single dither after a full filter cycle',
                'Filter rotation to distribute exposures',
                'Smart Exposure over Take Exposure for reliability'
            ]
        },
        {
            type: 'heading',
            content: 'Startup & Shutdown'
        },
        {
            type: 'list',
            items: [
                'Startup: Cool camera, unpark mount, connect to PHD2, run checks',
                'Shutdown: Stop guiding, warm camera, park mount, disconnect equipment'
            ]
        },
        {
            type: 'heading',
            content: 'Advanced: Target Scheduler Plugin'
        },
        {
            type: 'paragraph',
            content: 'For complex multi-target sessions, the Target Scheduler plugin can select optimal targets automatically.'
        },
        {
            type: 'heading',
            content: 'Safety for Unattended Operation'
        },
        {
            type: 'list',
            items: [
                'Weather Monitoring: Add Loop While Safe',
                'Hardware Safety: Use limit switches/safety relay',
                'Error Handling: Define retries and fallback behavior',
                'Remote Access: AnyDesk, TeamViewer, Ground Station plugin'
            ]
        },
        {
            type: 'heading',
            content: 'Common Failures and Fixes'
        },
        {
            type: 'list',
            items: [
                'Autofocus inconsistent → check step size, use Hocus Focus',
                'Target drifts despite guiding → add Center After Drift, verify PHD2, balance mount',
                'Filter changes cause guide star loss → disable guiding during filter change, restore guiding',
                'Sequence stops unexpectedly → check loop conditions, USB reliability, NINA logs'
            ]
        },
        {
            type: 'heading',
            content: 'Essential Plugins'
        },
        {
            type: 'list',
            items: [
                'Hocus Focus',
                'Filter Offset Calculator',
                'TPPA (Three Point Polar Alignment)',
                'Advanced Sequencer Validator',
                'Ground Station',
                'Discord Alert / Pushover'
            ]
        },
        {
            type: 'heading',
            content: 'Building Reliable Automation'
        },
        {
            type: 'paragraph',
            content: 'Start simple. Build one working target with basic triggers and loop conditions. Once solid, add complexity. Test failures (disconnect USB, cover guide scope, etc.) until your sequence recovers reliably.'
        }
    ]
},
{
    id: 'custom-ascom-driver-nina',
    title: 'Building Custom ASCOM Drivers',
    category: 'advanced',
    image: 'guides/previews/custom-ascom-driver-nina.jpg',
    shortDescription: 'Building ASCOM drivers to integrate custom hardware with NINA and other imaging software.',
    link: 'guides/custom-ascom-driver-nina.html',
    detailImage: '../guides/custom-ascom-driver-nina.jpg',
    fullContent: [
        {
            type: 'paragraph',
            content: 'This guide covers building ASCOM drivers to integrate custom hardware with NINA and other imaging software. It focuses on practical implementation and what actually matters for reliability.'
        },
        {
            type: 'paragraph',
            content: '<strong>Prerequisites:</strong> You should understand serial communication (Arduino/ESP32) and basic programming. This guide focuses on what\'s involved in making a working driver.'
        },
        {
            type: 'heading',
            content: 'What ASCOM Does'
        },
        {
            type: 'paragraph',
            content: 'ASCOM provides standard interfaces between astronomy software and hardware. It lets NINA control your mount, camera, focuser, and other devices through a common protocol. Custom hardware needs an ASCOM driver to integrate properly.'
        },
        {
            type: 'paragraph',
            content: 'The driver translates ASCOM method calls into commands your hardware understands, sends them over serial, and reports status back to the software.'
        },
        {
            type: 'heading',
            content: 'Getting Started'
        },
        {
            type: 'paragraph',
            content: 'Use Visual Studio with ASCOM Platform 7 driver templates. Download <a href="https://ascom-standards.org/" target="_blank">ASCOM Platform</a> and install the Visual Studio extensions. Templates generate the structure. You implement the hardware communication.'
        },
        {
            type: 'paragraph',
            content: 'Pick your device interface:'
        },
        {
            type: 'list',
            items: [
                '<strong>ICoverCalibratorV2</strong> - Flat panels with motorized covers and lights',
                '<strong>IFocuserV3</strong> - Motorized focusers with position tracking',
                '<strong>IFilterWheelV3</strong> - Filter wheels with named positions',
                '<strong>IRotatorV3</strong> - Camera rotators with angle control',
                '<strong>ISwitchV3</strong> - Power switches and relay control',
                '<strong>ISafetyMonitorV3</strong> - Weather sensors and safety monitors'
            ]
        },
        {
            type: 'paragraph',
            content: 'Each interface defines required methods and properties. Templates include these. You fill in the serial communication logic.'
        },
        {
            type: 'heading',
            content: 'Driver Architecture'
        },
        {
            type: 'paragraph',
            content: '<strong>Driver Class:</strong> Implements the ASCOM interface. Handles connection state for each client. Routes method calls to hardware class. Provides setup dialog for COM port selection.'
        },
        {
            type: 'paragraph',
            content: '<strong>Hardware Class:</strong> Manages the serial connection. Single shared instance for all clients. Tracks actual hardware state. Runs background threads for reading serial responses.'
        },
        {
            type: 'paragraph',
            content: 'This structure lets multiple programs connect to your driver while maintaining one hardware connection.'
        },
        {
            type: 'heading',
            content: 'Serial Communication Pattern'
        },
        {
            type: 'paragraph',
            content: 'When NINA calls OpenCover(), your driver sends "open" over serial. Hardware responds with status messages. Driver updates internal state and reports back to NINA.'
        },
        {
            type: 'paragraph',
            content: 'Commands like <code>open</code>, <code>close</code>, <code>led:50</code>. Responses like <code>OPENING</code>, <code>OPEN</code>, <code>CLOSED</code>.'
        },
        {
            type: 'paragraph',
            content: 'Run a background thread that continuously reads serial and updates state variables. Never block ASCOM method calls waiting for hardware responses. Methods must return quickly (under 1 second).'
        },
        {
            type: 'paragraph',
            content: 'NINA polls properties like CoverState or IsMoving to track completion. Your background thread updates these as hardware sends status messages.'
        },
        {
            type: 'heading',
            content: 'Problems I Hit Building Mine'
        },
        {
            type: 'paragraph',
            content: 'These weren\'t obvious from ASCOM documentation. Most broke during real imaging sessions, not bench testing.'
        },
        {
            type: 'paragraph',
            content: '<strong>USB Serial Reliability</strong><br>Connections drop randomly. Packets get lost. Implement retry logic for failed commands. Send critical status messages multiple times from hardware with short delays between each. If one packet drops, others get through.'
        },
        {
            type: 'paragraph',
            content: '<strong>Hardware Timing</strong><br>Servo takes 3 seconds to fully open. Without progress updates, NINA thinks the driver hung. Send status messages during operation so software knows it\'s executing, not stuck.'
        },
        {
            type: 'paragraph',
            content: '<strong>Initialization Delay</strong><br>Wait 1.5 seconds after opening serial port before sending commands. Microcontroller needs time to initialize. First command fails without this delay.'
        },
        {
            type: 'paragraph',
            content: '<strong>State Synchronization</strong><br>Send status request immediately after connecting. Syncs driver state with actual hardware position. Otherwise driver might report wrong state.'
        },
        {
            type: 'paragraph',
            content: '<strong>Timeout Recovery</strong><br>If operation flag stays true for 10+ seconds without completion, reset it. Prevents driver from getting stuck if completion message gets lost.'
        },
        {
            type: 'heading',
            content: 'Testing Your Driver'
        },
        {
            type: 'paragraph',
            content: '<strong>ConformU</strong><br>Official ASCOM validation tool. Tests all required methods, timing, edge cases. Download from <a href="https://github.com/ASCOMInitiative/ConformU" target="_blank">ASCOM GitHub</a>. Run it before releasing your driver.'
        },
        {
            type: 'paragraph',
            content: '<strong>Break Things Deliberately</strong>'
        },
        {
            type: 'list',
            items: [
                'Unplug USB during operation',
                'Power cycle hardware mid-command',
                'Send rapid repeated commands',
                'Connect multiple programs simultaneously'
            ]
        },
        {
            type: 'paragraph',
            content: 'Driver should recover from all failures without crashing or leaving hardware in bad state.'
        },
        {
            type: 'paragraph',
            content: '<strong>Logging</strong><br>Enable ASCOM TraceLogger. Log every command sent, response received, state change. When something breaks during unattended imaging, logs are your only diagnostic.'
        },
        {
            type: 'heading',
            content: 'Common Mistakes'
        },
        {
            type: 'list',
            items: [
                'Writing directly to registry instead of using ASCOM Profile object',
                'Opening permanent modeless windows instead of modal setup dialogs',
                'Not implementing all required interface methods'
            ]
        },
        {
            type: 'heading',
            content: 'Configuration'
        },
        {
            type: 'paragraph',
            content: 'Store COM port and device settings in ASCOM Profile. Provides persistent storage across sessions. Use the Profile object, don\'t write directly to registry.'
        },
        {
            type: 'paragraph',
            content: 'Setup dialog should have COM port dropdown with refresh button. If user opens setup while connected, disconnect temporarily, allow changes, reconnect after.'
        },
        {
            type: 'heading',
            content: 'Integration'
        },
        {
            type: 'paragraph',
            content: 'Register driver with ASCOM using regasm or an installer. Connect in NINA via Equipment menu. Test full imaging sequence. Run unattended overnight to verify reliability under real conditions.'
        },
    ]
},
    {
        id: 'stacked-images-look-like',
        title: 'What Should Stacked Images Look Like?',
        category: 'basics',
        image: 'guides/previews/stacked-images-look-like.jpg',
        shortDescription: 'Understanding why your stacked astrophotography images look dim, flat, and green before processing.',
        link: 'guides/stacked-images-look-like.html',
        detailImage: '../guides/stacked-images-look-like.jpg',
        fullContent: [
            {
                type: 'paragraph',
                content: 'After stacking your astrophotography data into a FITS file, the result might look underwhelming: dim, flat, and possibly green. This is expected, and it\'s due to the image being in a linear state.'
            },
            {
                type: 'heading',
                content: 'Linear vs. Stretched Images'
            },
            {
                type: 'paragraph',
                content: 'Most processing software saves stacked images in linear format. This means:'
            },
            {
                type: 'list',
                items: [
                    'The brightness values are preserved exactly as captured by the sensor.',
                    'No adjustments are made to enhance contrast or color balance.',
                    'All the faint detail is compressed into the lower end of the histogram.'
                ]
            },
            {
                type: 'paragraph',
                content: 'Linear images are optimized for data retention, not for display. They contain the full dynamic range from your exposures, which is important for scientific use or high-quality post-processing.'
            },
            {
                type: 'paragraph',
                content: 'On the other hand, a stretched image has had a nonlinear transformation applied (typically a histogram stretch or curve), which redistributes pixel brightness to make faint structures visible on a standard screen.'
            },
            {
                type: 'heading',
                content: 'Why It Looks Green'
            },
            {
                type: 'paragraph',
                content: 'If you\'re using a one-shot color (OSC) camera, your sensor has a Bayer matrix with 2× as many green pixels as red or blue. After stacking, the green channel is usually dominant unless color calibration has been applied. Most stackers don\'t do this by default.'
            },
            {
                type: 'paragraph',
                content: 'This is corrected later in the processing pipeline through proper white balance or photometric color calibration.'
            },
            {
                type: 'heading',
                content: 'What to Check in the Stack'
            },
            {
                type: 'paragraph',
                content: 'Although the image will look dim or unprocessed, you can still evaluate a few technical aspects:'
            },
            {
                type: 'list',
                items: [
                    'Star shape: Should be round, indicating good tracking and focus.',
                    'Signal presence: Nebulae or galaxies should be faintly visible.',
                    'Noise: Should be reduced compared to a single sub.',
                    'Histogram: Should show most values away from clipping (especially black point).'
                ]
            },
            {
                type: 'heading',
                content: 'When to Stretch'
            },
            {
                type: 'paragraph',
                content: 'You should only stretch the image after performing critical preprocessing steps like:'
            },
            {
                type: 'list',
                items: [
                    'Background extraction',
                    'Color calibration',
                    'Noise reduction (if working in linear space)'
                ]
            },
            {
                type: 'paragraph',
                content: 'Once you\'re done with those, a non-linear stretch brings out detail and color, and makes the image suitable for final adjustments.'
            },
            {
                type: 'heading',
                content: 'Summary'
            },
            {
                type: 'list',
                items: [
                    'Stacked FITS files are linear by default.',
                    'Linear images will appear dark, flat, and often green.',
                    'This format preserves dynamic range and is meant for further processing.',
                    'Stretching transforms it into a viewable, high-contrast image.',
                    'Don\'t judge quality based on initial appearance: evaluate data integrity, not aesthetics.'
                ]
            }
        ]
    }
];

// Render guides on the main guides page
function renderGuides() {
    const guidesGrid = document.querySelector('.guides-grid');
    if (!guidesGrid) return;

    const advanced = guidesData.filter(g => g.category === 'advanced');
    const basics = guidesData.filter(g => g.category === 'basics');
    const all = guidesData;

    const activeFilter = document.querySelector('.tag.active')?.textContent.toLowerCase() || 'all';

    let displayGuides;
    if (activeFilter === 'advanced') displayGuides = advanced;
    else if (activeFilter === 'basics') displayGuides = basics;
    else displayGuides = all;


    if (displayGuides.length === 0) {
        guidesGrid.innerHTML = '<p style="text-align: center; color: var(--gray-text);">No guides found.</p>';
        return;
    }

    guidesGrid.innerHTML = `
        <div class="guides-list">
            ${displayGuides.map(guide => `
                <a href="${guide.link}" class="guide-card">
                    <img src="${guide.image}" alt="${guide.title}" class="guide-image">
                    <div class="guide-content">
                        <h3>${guide.title}</h3>
                        <p>${guide.shortDescription}</p>
                    </div>
                </a>
            `).join('')}
        </div>
    `;

    guidesGrid.querySelectorAll('.guide-image').forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', () => img.classList.add('loaded'));
        }
    });
}

function renderGuideDetail() {
    const currentPage = window.location.pathname.split('/').pop();
    const guideId = currentPage.replace('.html', '');
    
    const guide = guidesData.find(g => g.id === guideId);
    if (!guide || !guide.fullContent) return;

    document.title = `${guide.title} - Astrotaca`;
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = guide.title;

    const sectionHeader = document.querySelector('.section-header h1');
    if (sectionHeader) sectionHeader.textContent = guide.title;

    const detailImageContainer = document.querySelector('.guide-detail-image-container');
    if (detailImageContainer && guide.detailImage) {
        detailImageContainer.innerHTML = `<img src="${guide.detailImage}" alt="${guide.title}" class="guide-detail-image">`;
    }

    const guideContent = document.querySelector('.guide-detail-content');
    if (guideContent && guide.fullContent) {
        guideContent.innerHTML = guide.fullContent.map(block => {
            switch(block.type) {
                case 'heading':
                    return `<h2>${block.content}</h2>`;
                case 'paragraph':
                    return `<p>${block.content}</p>`;
                case 'list':
                    return `<ul>${block.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
                case 'image':
                    return `<img src="${block.src}" alt="${block.alt}" class="guide-detail-image">`;
                default:
                    return '';
            }
        }).join('');
    }
}

function setupFilters() {
    const tags = document.querySelectorAll('.tags .tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            renderGuides();
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderGuides();
        renderGuideDetail();
        setupFilters();
    });
} else {
    renderGuides();
    renderGuideDetail();
    setupFilters();
}
