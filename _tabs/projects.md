---
layout: page
icon: fas fa-list-check
toc: true
order: 6
---

# Flap flat panel

Let’s be honest. Taking flat frames is one of those things that feels simple... until it isn’t.

You want even illumination, zero gradients, minimal setup effort, and preferably something you don’t have to duct-tape to your telescope. And don’t even get me started on holding a tablet in front of your scope at 4am while freezing your hands off. Yeah, no thanks.

So I built something better. A lightweight, motorized flat panel that mounts directly to the scope and follows a fully automated sequence.

## The Problem

Perfect flat frames are non‑negotiable, but every store‑bought panel I’ve tried is either overpriced, too bulky to use with the dew shield on, or too much of a hassle to set up—especially for remote rigs.

I needed something low-profile, consistent, and integrated. Something I could leave mounted on the front of my telescope 24/7 without affecting portability or balance. Something I could *flip* into place when needed... and flip out of the way when not.

And that’s exactly why I built the Flap Flat Panel.

## The Design

- **3D-Printed Housing**  
  Made from black PETG for strength and minimal reflections. It sticks to your telescope hood with a clamp.

- **Motorized flip**  
  A 17 kg/cm servo swings the panel into place for flats, then flips it out of the way when you start imaging.

- **Even lighting**  
  A 12 V LED strip feeds into an acrylic light guide plate, backed by two layers of diffuser film to eliminate hotspots and deliver even illumination.

- **Magnetic latch**  
  Neodymium magnets hold the panel firmly in a closed or opened position.

- **USB‑C control**  
  Hooks up to your mini‑PC for 20 kHz PWM dimming and automated flat‑frame runs—no extra control box required.

- **Drivers & software**  
  - **ASCOM driver**: tested and works seamlessly with N.I.N.A and other ASCOM hosts.  
  - **Standalone Python app**: a simple script for running flats if you don’t need a full observatory suite.  


## Why It Works

Even lighting is essential for capturing high-quality flats. A uniform light source ensures that every part of your sensor is evenly exposed, preventing issues like vignetting or dust spots from appearing in your final images. An uneven light source can introduce artifacts, compromising the calibration process and ultimately degrading your image quality.

This flat panel delivers consistent, uniform illumination, ensuring your sensor receives the same exposure every time. Mounted directly to the dew shield, its fixed position eliminates any risk of misalignment or movement between sessions. This means you can count on repeatable, accurate calibration every time you use it.

Thanks to 20 kHz PWM dimming, you can take flats with exposures as short as 0.01 seconds without any banding. While longer exposures are recommended for optimal results, this flexibility allows you to capture perfect flats even during quick sessions.

With USB-C control, the entire process is automated, eliminating the need for manual adjustments. This makes it a perfect solution for remote rigs or unattended imaging sessions, allowing for hands-off operation and seamless integration into your workflow.

## Coming Soon

I’m finishing up the last tweaks to the PCB and hinge design. Once everything's set, the Flap Flat Panel will be available for purchase, fully assembled and ready to use.

Stay tuned for more details.
